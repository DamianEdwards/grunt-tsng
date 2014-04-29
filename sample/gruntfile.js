/*
 * grunt-tsng
 * https://github.com/DamianEdwards/grunt-tsng
 *
 * Copyright (c) 2014 Damian Edwards
 * Licensed under the Apache 2.0 License.
 */

module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        connect: {
            "static": {
                options: {
                    keepalive: true,
                    hostname: "localhost",
                    port: 8001,
                    open: true
                }
            }
        },
        copy: { // This is to work around an issue with the dt-angular bower package https://github.com/dt-bower/dt-angular/issues/4
            fix: {
                files: {
                    "bower_components/jquery/jquery.d.ts": ["bower_components/dt-jquery/jquery.d.ts"]
                }
            }
        },
        clean: {
            options: { force: true },
            tsng: ['app/**/*.ng.ts'],
            js: ['js/**/*.*']
        },        
        tsng: {
            options: {
                extension: ".ng.ts"
            },
            dev: {
                files: {
                    "app": ['app/**/*.ts', "!**/*.ng.ts"]
                }
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['app/**/*.ts', '!**/*.ng.ts']
            }
        },
        typescript: {
            options: {
                module: 'amd', // or commonjs
                target: 'es5', // or es3
                sourcemap: false
            },
            dev: {
                files: {
                    'js/app.js': ['app/**/*.ng.ts']
                }
            }
        },
    });

    grunt.loadTasks("../tasks");

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-typescript");

    grunt.registerTask("sample", ["copy:fix", "build", "connect"]);
    grunt.registerTask("build", ["clean", "tslint", "tsng", "typescript"]);
    grunt.registerTask("default", ["build"]);
};