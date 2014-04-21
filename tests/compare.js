/*
 * grunt-tsng
 * https://github.com/DamianEdwards/grunt-tsng
 *
 * Copyright (c) 2014 Damian Edwards
 * Licensed under the Apache 2.0 License.
 */

module.exports = function (grunt) {
    "use strict";

    var fs = require("fs");
    var path = require("path");
    var util = require("util");

    grunt.registerMultiTask("compare", "Compares two directories", function () {
        grunt.log.writeln("Comparing directories:");
        grunt.log.writeln(util.inspect(this.files.map(function (el) { return el.src[0]; })));

        grunt.verbose.writeln("Compare this.files: " + util.inspect(this.files));

        var results = [];

        this.files.every(function (fileset) {
            if (fileset.src.length !== 1) {
                grunt.log.error("Configured file set must contain just one directory: " + utils.inspect(fileset.src));
                return false;
            }

            var src = path.resolve(fileset.src[0]);
            var dest = path.resolve(fileset.dest);

            if (!grunt.file.isDir(src)) {
                grunt.log.error("The configured src path is not a directory: " + src);
                return false;
            }

            if (!grunt.file.isDir(dest)) {
                grunt.log.error("The configured dest path is not a directory: " + dest);
                return false;
            }

            var result = compareDirs(src, dest);
            results.push(result);

            if (result.error) {
                return false;
            }
        });
        
        grunt.verbose.writeln("Results: " + util.inspect(results));

        var errors = results
            .map(function(result) {
                return result.error;
            })
            .filter(function(el) {
                return el;
            });

        if (errors.length) {
            grunt.log.error(errors[0]);
            return false;
        }

        grunt.log.ok("All directories match!");
    });

    function compareDirs(dir1, dir2) {
        grunt.verbose.writeln("   " + dir1 + " -> " + dir2);

        var dir1Files = [],
            dir2Files = [],
            error;

        // TODO: Check folder structure first using getDirs

        grunt.file.recurse(dir1, function (abspath, rootdir, subdir, filename) {
            dir1Files.push({
                abspath: abspath,
                rootdir: rootdir,
                subdir: subdir,
                filename: filename
            });
        });

        grunt.file.recurse(dir2, function (abspath, rootdir, subdir, filename) {
            dir2Files.push({
                abspath: abspath,
                rootdir: rootdir,
                subdir: subdir,
                filename: filename
            });
        });

        //grunt.log.writeln(util.inspect(dir1Files));
        //grunt.log.writeln(util.inspect(dir2Files));

        // Compare number of files
        if (dir1Files.length !== dir2Files.length) {
            return {
                error: grunt.util.error("Directories have different file count: \r\n" +
                    "    " + dir1 + ": " + dir1Files.length + "\r\n" +
                    "    " + dir2 + ": " + dir2Files.length)
            };
        }

        // Compare files
        dir1Files.every(function (dir1File, idx) {
            var dir2File = dir2Files[idx];
            var dir1FileContent, dir2FileContent;
            
            grunt.verbose.writeln("Comparing files: \r\n" +
                "    " + util.inspect(dir1File) + "\r\n" +
                "    " + util.inspect(dir2File));

            // Compare file name
            if (dir1File.subdir !== dir2File.subdir || dir1File.filename !== dir2File.filename) {
                error = {
                    error: grunt.util.error("Mismatched file name found: \r\n" +
                        "    " + dir1File.abspath + "\r\n" +
                        "    " + dir2File.abspath)
                };
                return false;
            }

            // Compare file content
            dir1FileContent = grunt.file.read(dir1File.abspath);
            dir2FileContent = grunt.file.read(dir2File.abspath);
            if (dir1FileContent !== dir2FileContent) {
                error = {
                    error: grunt.util.error("Mismatched file content found: \r\n" +
                        "    " + dir1File.abspath + "\r\n" +
                        "    " + dir2File.abspath)
                };
                return false;
            }

            return true;
        });

        return error || { };
    }

    function getDirs(rootDir) {
        return fs.readdirSync(rootDir)
            .map(function (file) {
                var filePath = path.join(rootDir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    return filePath;
                }
            })
            .filter(function (el) {
                return el;
            });
    }
};