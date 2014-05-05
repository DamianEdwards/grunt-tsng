/*
 * grunt-tsng
 * https://github.com/DamianEdwards/grunt-tsng
 *
 * Copyright (c) 2014 Damian Edwards
 * Licensed under the Apache 2.0 License.
 */

module.exports = function (grunt) {
    "use strict";

    var path = require("path");
    var util = require("util");

    var newLine = (process.platform === "win32" ? "\r\n" : "\n");

    grunt.registerMultiTask("tsng", "Generate AngularJS registration blocks based on conventions and annotations in TypeScript files.", function () {

        // this.target is current target
        // this.data is config for current target
        // this.files is globbed files array for current target

        var options = this.options({
            extension: ".ng.ts"
        });

        //grunt.log.writeln("Extension path: " + options.extension);

        var overallResult = {
            modules: [],
            controllers: [],
            services: [],
            directives: [],
            filters: [],
            fileTally: 0
        };
        var error;

        this.files.forEach(function (fileSet, idx) {
            var setResult = processSet(fileSet, options);

            if (setResult.error) {
                error = setResult.error;
                return false;
            }

            //logResult(setResult, idx + 1);
            sumResult(setResult, overallResult);
        });

        if (error) {
            grunt.log.error(error);
            return;
        }

        function sumResult(source, target) {
            if (!source || !target) {
                return;
            }

            for (var key in target) {
                if (!target.hasOwnProperty(key) || !source.hasOwnProperty(key)) {
                    continue;
                }

                var targetType = (typeof (target[key])).toLowerCase();
                var sourceType = (typeof (source[key])).toLowerCase();

                if (targetType !== sourceType) {
                    continue;
                }

                if (targetType === "number" || targetType === "string") {
                    target[key] = target[key] + source[key];
                } else if (Array.isArray(target[key])) {
                    target[key] = target[key].concat(source[key]);
                }
            }
        }

        function logResult(result, setId) {
            grunt.log.writeln("------------------------------------------");
            grunt.log.writeln("File Set #" + setId);
            grunt.log.writeln("------------------------------------------");

            grunt.log.writeln("Modules:");
            result.modules.forEach(function (module) {
                grunt.log.writeln("   " + module.name + (module.file ? " defined in " + module.file + " with " + (module.dependencies ? module.dependencies.length : 0) + " dependencies" : " has no file"));
            });

            grunt.log.writeln("Controllers:");
            result.controllers.forEach(function (controller) {
                grunt.log.writeln("   " + controller.name + " using fn " + controller.fnName + " with " + controller.dependencies.length + " dependencies from " + controller.file);
            });

            grunt.log.writeln("Services:");
            result.services.forEach(function (service) {
                grunt.log.writeln("   " + service.name + " using fn " + service.fnName + " with " + service.dependencies.length + " dependencies from " + service.file);
            });

            grunt.log.writeln("Directives:");
            result.directives.forEach(function (directive) {
                grunt.log.writeln("   " + directive.name + " using fn " + directive.fnName + " with " + directive.dependencies.length + " dependencies from " + directive.file);
            });

            grunt.log.writeln("Filters:");
            result.filters.forEach(function (filter) {
                grunt.log.writeln("   " + filter.name + " using fn " + filter.fnName + " from " + filter.file);
            });

            for (var key in result) {
                if (key === "fileTally" || !result.hasOwnProperty(key)) {
                    continue;
                }

                var items = result[key];
                grunt.log.writeln(items.length + " " + key + " found in " + result.fileTally + " files");
            }
        }

        function processSet(fileSet, options) {
            grunt.verbose.writeln("processSet->fileSet: " + util.inspect(fileSet));

            var result = {
                modules: [],
                controllers: [],
                services: [],
                directives: [],
                filters: [],
                fileTally: 0
            };
            var modules = {};
            var files = {};
            var error;
            var dest = path.resolve(fileSet.dest);
            var moduleName;
            var serviceNames;

            grunt.verbose.writeln("dest file path: " + dest);

            fileSet.src.forEach(function (filepath) {
                var fileResult = processFile(filepath, dest, options);
                fileResult.path = filepath;

                if (fileResult.error) {
                    error = fileResult.error;
                    return false;
                }

                fileResult.module = mergeModules(fileResult, modules);

                if (!fileResult.module) {
                    throw new Error("File result for file " + filepath + " doesn't have a module");
                }

                if (!fileResult.module.file) {
                    files[filepath] = fileResult;
                }

                sumResult(fileResult, result);
                result.modules.push(fileResult.module);
                result.fileTally++;
            });

            if (error) {
                return { error: error };
            }

            serviceNames = result.services.map(function (service) {
                return service.name;
            });

            // Emit module files
            var moduleNames = [];
            for (moduleName in modules) {
                if (!modules.hasOwnProperty(moduleName)) {
                    continue;
                }

                moduleNames.push(modules[moduleName].name);
            }

            for (moduleName in modules) {
                if (!modules.hasOwnProperty(moduleName)) {
                    continue;
                }
                
                emitModuleFile(modules[moduleName], dest, moduleNames, serviceNames, options);

                if (!modules[moduleName].file) {
                    throw new Error("Module " + moduleName + " doesn't have a file");
                }
            }

            // Emit non-module files
            for (var filepath in files) {
                if (!files.hasOwnProperty(filepath)) {
                    continue;
                }

                emitFile(files[filepath], serviceNames, options);
            }

            return result;
        }

        function processFile(filepath, dest, options) {
            var result = {
                module: null,
                controllers: [],
                services: [],
                directives: [],
                filters: []
            };
            var regex = {
                // //@NgModule('moduleName')
                // module My.Great.Module {
                moduleComment: /^\s*\/\/@NgModule(?:\(?['"]?([\w.]+)['"]?\)?\s*)?$/,
                moduleDeclaration: /^\s*(?:export\s+)?module\s*([\w.]*)\s*{\s*$/,

                // //@NgController('controllerName')
                // class MyController implements IMyViewModel {
                controllerComment: /^\s*\/\/@NgController(?:\(?['"]?([\w]*|skip\=true)['"]?\)?\s*)?$/,
                controllerDeclaration: /^\s*(?:export\s+)?class (\w+Controller)\s*/,

                // //@NgService('serviceName')
                // class MyService implements IMyService {
                serviceComment: /^\s*\/\/@NgService(?:\(?['"]?(\w+)['"]?\)?\s*)?$/,
                serviceDeclaration: /^\s*(?:export\s+)?class (\w+Service)\s+(?:implements\s+([\w.]+)\s*{)?/,

                // //@NgDirective('directiveName')
                // class MyDirective implements ng.IDirective {
                directiveComment: /^\s*\/\/@NgDirective(?:\(?['"]?(\w+)['"]?\)?\s*)?$/,
                directiveDeclaration: /^\s*(?:export\s+)?class (\w+Directive)\s+(?:implements\s+(\w.+)\s*{)?/,

                // //@NgFilter('filterName')
                // function filter(input: string) {
                filterComment: /^\s*\/\/\s*@NgFilter(?:\s*\(\s*['"]?(\w+)['"]?\s*\))?\s*$/,
                filterDeclaration: /^\s*function\s*([a-zA-Z_$]+)\s*\([a-zA-Z0-9_$:,\s]*\)/,

                // constructor($window: ng.IWindowService) {
                constructor: /constructor\s*\(\s*([^(]*)\s*\)\s*{/,

                closingBrace: /^\s*}\s*$/
            };
            var content = grunt.file.read(filepath);
            var lines = content.split(newLine);
            var module, line, matches, state, lastClosingBraceLine, error;
            var moduleFile;
            var expect = {
                anything: 0,
                moduleDeclaration: 1,
                controllerDeclaration: 2,
                serviceDeclaration: 4,
                directiveComment: 8,
                directiveDeclaration: 16,
                filterDeclaration: 32
            };
            var expecting = expect.anything;

            //debugger;

            for (var i = 0; i < lines.length; i++) {
                line = lines[i];

                //  Check for closing brace on a line by itself
                matches = line.match(regex.closingBrace);
                if (matches) {
                    lastClosingBraceLine = i;
                    continue;
                }

                if (expecting === expect.anything) {
                    // Check for module comment
                    matches = line.match(regex.moduleComment);
                    if (matches) {
                        expecting = expect.moduleDeclaration;
                        state = matches;
                        continue;
                    }

                    // Check for module declaration
                    matches = line.match(regex.moduleDeclaration);
                    if (matches) {
                        if (module) {
                            // A module is already declared for this file
                            error = "Error: " + filepath + "(" + i + "): Only one module can be declared per file";
                            break;
                        }

                        moduleFile = parseModuleFile(filepath);
                        moduleFile.name = matches[1];
                        moduleFile.declarationLine = i;
                        module = moduleFile;

                        state = null;
                    }

                    // Check for controller comment
                    matches = line.match(regex.controllerComment);
                    if (matches) {
                        expecting = expect.controllerDeclaration;
                        state = matches;
                        continue;
                    }

                    // Check for controller declaration
                    matches = line.match(regex.controllerDeclaration);
                    if (matches) {
                        (function () {
                            var fnName = matches[1];
                            var name = (module ? module.name + "." : "") + fnName;
                            var ctor = parseConstructor(content) || { args: [] };
                            
                            result.controllers.push({
                                module: module,
                                name: name,
                                fnName: fnName,
                                dependencies: ctor.args,
                                file: filepath,
                                ctorStartLine: ctor.startLine,
                                ctorEndLine: ctor.endLine
                            });
                        }());
                        expecting = expect.anything;
                        continue;
                    }

                    // Check for service comment
                    matches = line.match(regex.serviceComment);
                    if (matches) {
                        expecting = expect.serviceDeclaration;
                        state = matches;
                        continue;
                    }

                    // Check for service declaration
                    matches = line.match(regex.serviceDeclaration);
                    if (matches) {
                        (function () {
                            var className = matches[1];
                            var interfaceName = matches[2];
                            var name = (module ? module.name + "." : "") + (interfaceName || className);
                            var ctor = parseConstructor(content) || { args: [] };

                            result.services.push({
                                module: module,
                                name: name,
                                fnName: className,
                                dependencies: ctor.args,
                                file: filepath,
                                ctorStartLine: ctor.startLine,
                                ctorEndLine: ctor.endLine
                            });
                        }());
                        expecting = expect.anything;
                        continue;
                    }

                    // Check for directive comment
                    matches = line.match(regex.directiveComment);
                    if (matches) {
                        //debugger;
                        expecting = expect.directiveComment | expect.directiveDeclaration;
                        state = { names: [] };
                        state.names.push(matches[1]);
                        continue;
                    }

                    // Check for filter comment
                    matches = line.match(regex.filterComment);
                    if (matches) {
                        expecting = expect.filterDeclaration;
                        state = matches;
                        continue;
                    }
                }

                if (expecting === expect.moduleDeclaration) {
                    // Check for module declaration
                    matches = line.match(regex.moduleDeclaration);
                    if (matches) {
                        if (module) {
                            // A module is already declared for this file
                            error = "Error: " + filepath + "(" + i + "): Only one module can be declared per file";
                            break;
                        }

                        moduleFile = parseModuleFile(filepath);
                        moduleFile.name = state[1] || matches[1];
                        module = moduleFile;

                        state = null;
                        expecting = expect.anything;
                    } else {
                        // A module comment was found but the next line wasn't a module declaration
                        error = "Error: " + filepath + "(" + i + "): @NgModule must be followed by a TypeScript module declaration, e.g. module My.Module.Name {";
                        break;
                    }
                }

                if (expecting === expect.controllerDeclaration) {
                    if (state[1] === "skip=true") {
                        state = null;
                        expecting = expect.anything;
                        continue;
                    }

                    // Check for controller declaration
                    matches = line.match(regex.controllerDeclaration);
                    if (matches) {
                        (function () {
                            var name = (module ? module.name + "." : "") + (state[1] || matches[1]);
                            var ctor = parseConstructor(content) || { args: [] };
                            
                            result.controllers.push({
                                module: module,
                                name: name,
                                fnName: matches[1],
                                dependencies: ctor.args,
                                file: filepath,
                                startLine: ctor.startLine,
                                endLine: ctor.endLine
                            });
                        }());
                        expecting = expect.anything;
                        continue;
                    } else {
                        // A controller comment was found but the next line wasn't a controller declaration
                        error = "Error: " + filepath + "(" + i + "): @NgController must be followed by a TypeScript class declaration ending with 'Controller', e.g. class MyController implements IMyViewModel {";
                        break;
                    }
                }

                if (expecting === expect.serviceDeclaration) {
                    // Check for service declaration
                    matches = line.match(regex.serviceDeclaration);
                    if (matches) {
                        (function () {
                            var className = matches[1];
                            var interfaceName = matches[2];
                            var name = (module ? module.name + "." : "") + ((state ? state[1] : null) || interfaceName || className);
                            var ctor = parseConstructor(content) || { args: [] };

                            result.services.push({
                                module: module,
                                name: name,
                                fnName: className,
                                dependencies: ctor.args,
                                file: filepath,
                                ctorStartLine: ctor.startLine,
                                ctorEndLine: ctor.endLine
                            });
                        }());
                        expecting = expect.anything;
                        continue;
                    }
                }

                if (expecting & expect.directiveComment) {
                    // Check for directive comment
                    matches = line.match(regex.directiveComment);
                    if (matches) {
                        expecting = expect.directiveComment | expect.directiveDeclaration;
                        state.names.push(matches[1]);
                        continue;
                    }
                }

                if (expecting & expect.directiveDeclaration) {
                    // Check for directive function
                    matches = line.match(regex.directiveDeclaration);
                    if (matches) {
                        (function () {
                            var fnName = matches[1];
                            var ctor = parseConstructor(content) || { args: [] };

                            state.names.forEach(function (name) {
                                result.directives.push({
                                    module: module,
                                    file: filepath,
                                    name: name,
                                    fnName: fnName,
                                    classLine: i,
                                    ctorStartLine: ctor.startLine,
                                    ctorEndLine: ctor.endLine,
                                    dependencies: ctor.args
                                });
                            });
                        }());
                        expecting = expect.anything;
                        continue;
                    }
                }

                if (expecting === expect.filterDeclaration) {
                    // Check for filter function
                    matches = line.match(regex.filterDeclaration);
                    if (matches) {
                        result.filters.push({
                            module: module,
                            name: state[1] || matches[1],
                            fnName: matches[1],
                            file: filepath
                        });
                        state = null;
                        expecting = expect.anything;
                        continue;
                    }
                }
            }

            // EOF
            if (expecting !== expect.anything) {
                error = "Error: End of file " + filepath + " reached while expecting " + expecting;
            }

            if (error) {
                return {
                    error: error
                };
            }

            result.closingBraceLine = lastClosingBraceLine;
            result.module = module;

            return result;
        }

        function parseConstructor(fileContents) {
            // Extract details from constructor function
            // constructor($window: ng.IWindowService) {
            var regex = /constructor\s*\(\s*([^(]*)\s*\)\s*{/;
            var matches = fileContents.match(regex);
            var result = {};

            if (matches) {
                result.args = [];
                if (matches[1]) {
                    matches[1].split(",").forEach(function (arg) {
                        var argParts = arg.split(":");
                        var a = { name: argParts[0].trim() };
                        if (argParts.length > 1) {
                            a.type = argParts[1].trim();
                        }
                        result.args.push(a);
                    });
                }

                // Find line numbers where the constructor function starts/ends
                var startIndex = fileContents.indexOf(matches[0]);
                var endIndex = startIndex + matches[0].length;

                result.startLine = fileContents.substr(0, startIndex).split(newLine).length - 1;
                result.endLine = fileContents.substr(0, endIndex).split(newLine).length - 1;

                return result;
            }

            // No constructor found
            return null;
        }

        function parseModuleFile(filepath) {
            var regex = {
                dependencies: /var\s+dependencies\s*=\s*\[([\w\s.,"']*)\]/,
                // BUG: This finds configuration functions that are commented out
                configFn: /function\s*(configuration)\s*\(\s*([\w$:.,\s]*)\s*\)\s*{/,
                // BUG: This finds run functions that are commented out
                runFn: /function\s*(run)\s*\(\s*([\w$:.,\s]*)\s*\)\s*{/
            };
            var matches = {};
            var result = {};
            var content = grunt.file.read(filepath);

            for (var key in regex) {
                if (!regex.hasOwnProperty(key)) {
                    continue;
                }

                matches[key] = content.match(regex[key]);
                if (matches[key]) {
                    result.file = filepath;
                }
            }

            if (!result.file) {
                return result;
            }

            if (matches.dependencies) {
                var arrayMembers = matches.dependencies[1];
                var dependencies = [];
                if (arrayMembers) {
                    arrayMembers.split(",").forEach(function (dependency) {
                        dependency = trim(dependency.trim(), ["\"", "'"]);
                        dependencies.push(dependency);
                    });
                }
                result.dependencies = dependencies;
            }

            ["configFn", "runFn"].forEach(function (fn) {
                if (matches[fn]) {
                    var args = matches[fn][2];
                    var dependencies = [];
                    if (args) {
                        args.split(",").forEach(function (arg) {
                            var parts = arg.split(":");
                            var dependency = {
                                name: parts[0].trim()
                            };

                            if (parts[1]) {
                                dependency.type = parts[1].trim();
                            }

                            dependencies.push(dependency);
                        });
                    }
                    result[fn] = {
                        fnName: matches[fn][1],
                        dependencies: dependencies
                    };
                }
            });

            return result;
        }

        function emitModuleFile(module, dest, moduleNames, serviceNames, options) {
            var filepath = "";
            var content = "";
            var srcLines;

            if (module.file) {
                //debugger;
                // Module already has a file defined, just add the module registration
                filepath = module.file.substr(0, module.file.length - 3) + options.extension;
                srcLines = grunt.file.read(module.file).split(newLine);

                //grunt.log.writeln("module.declarationLine=" + module.declarationLine);

                srcLines.forEach(function (line, i) {
                    if (i === (module.declarationLine + 1)) {

                        // Add the module registration
                        content += indent() + "angular.module(\"" + module.name + "\", [" + newLine;

                        if (module.dependencies && module.dependencies.length) {
                            module.dependencies.forEach(function (d) {
                                var resolvedDependencyName = resolveTypeName(d, module.name, moduleNames);
                                content += indent(2) + "\"" + (resolvedDependencyName || d) + "\"," + newLine;
                            });
                        }

                        content += indent() + "])";

                        ["config", "run"].forEach(function (method) {
                            var fn = module[method + "Fn"];
                            if (fn) {
                                content += "." + method + "([" + newLine;
                                fn.dependencies.forEach(function (d) {
                                    var typeName;
                                    if (d.name.substr(0, 1) === "$") {
                                        typeName = d.name;
                                    } else {
                                        typeName = resolveTypeName(d.type, module.name, serviceNames);
                                        if (!typeName) {
                                            // Couldn't resolve type name
                                            throw new Error("Error: Can't resolve dependency for module function " + module.name + "." + method + " with name " + d.type);
                                        }
                                    }
                                    content += indent(2) + "\"" + typeName + "\"," + newLine;
                                });
                                content += indent(2) + fn.fnName + newLine + indent() + "])";
                            }
                        });

                        content += ";" + newLine + newLine;
                    }

                    content += line;

                    if (i < (srcLines.length - 1)) {
                        content += newLine;
                    }
                });
            } else {
                // We need to render a whole file
                filepath = path.join(dest, module.name + options.extension);
                content = "module " + module.name + " {" + newLine;
                content += indent() + "angular.module(\"" + module.name + "\", []);" + newLine;
                content += "}";
            }

            grunt.file.write(filepath, content);
            module.file = filepath;
        }

        function emitFile(file, serviceNames, options) {
            var filepath;
            var srcLines;
            var content = "";
            var module = file.module;

            filepath = file.path.substr(0, file.path.length - 3) + options.extension;
            srcLines = grunt.file.read(file.path).split(newLine);

            var emitCtor = false;
            if (file.directives.length && !file.directives[0].ctorStartLine) {
                emitCtor = true;
            }

            srcLines.forEach(function (line, i) {
                if (i === 0 && module.file) {
                    // Add reference to module file
                    // e.g. /// <reference path="../../MyModule.ng.ts" />

                    content += "/// <reference path=\"" + path.relative(path.dirname(filepath), module.file) + "\" />" + newLine + newLine;
                }

                var emitBind = file.directives.length ?
                    file.directives[0].ctorEndLine ?
                        (file.directives[0].ctorEndLine + 1) === i // Line after the ctor declartion ends
                        : (file.directives[0].classLine + 1) === i // No ctor already, so line after the class declaration
                    : false;

                if (emitBind) {
                    if (emitCtor) {
                        // Need to generate a ctor
                        content += indent(2) + "constructor() {" + newLine;
                    }
                    // Emit function to bind instance methods to 'this'
                    content += indent(3) + "for (var m in this) {" + newLine;
                    content += indent(4) + "if (this[m].bind) {" + newLine;
                    content += indent(5) + "this[m] = this[m].bind(this);" + newLine;
                    content += indent(4) + "}" + newLine;
                    content += indent(3) + "}" + newLine;
                    if (emitCtor) {
                        // Need to generate a ctor
                        content += indent(2) + "}" + newLine + newLine;
                    }
                }

                if (i === file.closingBraceLine && module.file) {
                    content += indent() + newLine;
                    content += indent() + "angular.module(\"" + module.name + "\")";

                    // Register controllers
                    file.controllers.forEach(function (controller) {
                        content += newLine;
                        content += indent(2) + ".controller(\"" + controller.name + "\", [" + newLine;

                        if (controller.dependencies && controller.dependencies.length) {
                            controller.dependencies.forEach(function (d) {
                                var typeName;
                                if (d.name.substr(0, 1) === "$") {
                                    typeName = d.name;
                                } else {
                                    typeName = resolveTypeName(d.type, module.name, serviceNames);
                                    if (!typeName) {
                                        // Couldn't resolve type name
                                        throw new Error("Error: Can't resolve dependency for controller " + controller.name + " with name " + d.type);
                                    }
                                }
                                content += indent(3) + "\"" + typeName + "\"," + newLine;
                            });
                        }

                        content += indent(3) + controller.fnName + newLine;
                        content += indent(2) + "])";
                    });

                    // Register services
                    file.services.forEach(function (service) {
                        content += newLine;
                        content += indent(2) + ".service(\"" + service.name + "\", [" + newLine;

                        if (service.dependencies && service.dependencies.length) {
                            service.dependencies.forEach(function (d) {
                                var typeName;
                                if (d.name.substr(0, 1) === "$") {
                                    typeName = d.name;
                                } else {
                                    typeName = resolveTypeName(d.type, module.name, serviceNames);
                                    if (!typeName) {
                                        // Couldn't resolve type name
                                        throw new Error("Error: Can't resolve dependency for service " + service.name + " with name " + d.type);
                                    }
                                }
                                content += indent(3) + "\"" + typeName + "\"," + newLine;
                            });
                        }

                        content += indent(3) + service.fnName + newLine;
                        content += indent(2) + "])";
                    });

                    // Register directives
                    file.directives.forEach(function (directive) {
                        content += newLine;
                        content += indent(2) + ".directive(\"" + directive.name + "\", [" + newLine;

                        if (directive.dependencies && directive.dependencies.length) {
                            directive.dependencies.forEach(function (d) {
                                var typeName;
                                if (d.name.substr(0, 1) === "$") {
                                    typeName = d.name;
                                } else {
                                    typeName = resolveTypeName(d.type, module.name, serviceNames);
                                    if (!typeName) {
                                        // Couldn't resolve type name
                                        throw new Error("Error: Can't resolve dependency for directive " + directive.name + " with name " + d.type);
                                    }
                                }
                                content += indent(3) + "\"" + typeName + "\"," + newLine;
                            });
                        }

                        var alphabet = "abcdefghijklmnopqrstuvwxyz";
                        alphabet += alphabet.toUpperCase();

                        var argList = directive.dependencies.map(function (d, index) {
                            return alphabet.substr(index, 1);
                        });

                        content += indent(3) + "function (";
                        content += argList;
                        content += ") {" + newLine;
                        content += indent(4) + "return new " + directive.fnName + "(" + argList + ");" + newLine;
                        content += indent(3) + "}" + newLine;
                        content += indent(2) + "])";
                    });

                    // Register filters
                    file.filters.forEach(function (filter) {
                        content += newLine;
                        content += indent(2) + ".filter(\"" + filter.name + "\", () => " + filter.fnName + ")";
                    });

                    content += ";" + newLine;
                }

                content += line;

                if (i < (srcLines.length - 1)) {
                    content += newLine;
                }
            });

            grunt.file.write(filepath, content);
        }

        function mergeModules(fileResult, modules) {
            var module = fileResult.module;

            if (!module) {
                return module;
            }

            if (!module.file &&
                (!fileResult.controllers || !fileResult.controllers.length) &&
                (!fileResult.services || !fileResult.services.length) &&
                (!fileResult.directives || !fileResult.directives.length) &&
                (!fileResult.filters || !fileResult.filters.length)) {

                //grunt.log.writeln("Module " + module.name + " contains no angular types, skipping file emission");

                // No angular types created, just no-op
                return module;
            }

            var resolvedModule = module;

            if (modules[module.name]) {
                // Existing module
                if (module.file) {
                    if (modules[module.name].file) {
                        // Error: Module defined in multiple files
                        throw new Error("tsng: Module '" + module.name + "' defined in multiple files");
                    }
                    modules[module.name].file = module.file;
                }
                resolvedModule = modules[module.name];
            } else {
                modules[module.name] = module;
            }

            return resolvedModule;
        }

        function resolveTypeName(name, moduleName, allNames) {
            /// <param name="name" type="String" />
            /// <param name="moduleName" type="String" />
            /// <param name="allNames" type="Array" elementType="String" />

            //debugger;
            //grunt.log.writeln(util.inspect({ name: name, moduleName: moduleName, allNames: allNames }));

            var prefix, matchedIndex;
            var parts = moduleName.split(".");

            if (parts.length === 1) {
                matchedIndex = allNames.indexOf(moduleName + "." + name);
                if (matchedIndex >= 0) {
                    return allNames[matchedIndex];
                }
                // No match found!
                return null;
            }

            for (var i = parts.length - 1; i >= 0; i--) {
                prefix = "";
                parts.forEach(function (part, index) {
                    if (index <= i) {
                        prefix += part + ".";
                    }
                });

                matchedIndex = allNames.indexOf(prefix + name);
                if (matchedIndex >= 0) {
                    return allNames[matchedIndex];
                }
            }

            // No match found!
            return null;
        }

        function trim(target, chars) {
            /// <param name="target" type="String" />
            /// <param name="chars" type="Array" />

            //debugger;

            var result, i, c;

            chars = chars || [" "];

            if (!target) {
                return target;
            }

            result = "";

            // Trim from start
            for (i = 0; i < target.length; i++) {
                c = target[i];
                if (chars.indexOf(c) < 0) {
                    result = target.substr(i);
                    break;
                }
            }

            // Trim from end
            for (i = result.length - 1; i >= 0; i--) {
                c = result[i];
                if (chars.indexOf(c) < 0) {
                    result = result.substring(0, i + 1);
                    break;
                }
            }

            return result;
        }

        function indent(length, char) {
            length = length || 1; // Default to 1 level of indent
            char = char || "    "; // Default to 4 spaces
            var result = "";
            for (var i = 0; i < length; i++) {
                result += char;
            }
            return result;
        }
    });
};