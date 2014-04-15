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
        jshint: {
            all: [
                "Gruntfile.js",
                "tests/compare.js",
                "tasks/**/*.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        clean: {
            test: {
                src: ["tests/*/actual"]
            }
        },
        copy: {
            test: {
                files: [
                    {
                        expand: true,
                        cwd: "tests",
                        src: "*/src/*.*",
                        dest: "tests",
                        rename: function (dest, src) {
                            var newDest = dest + "/" + src.replace("/src/", "/actual/");
                            return newDest;
                        }
                    }
                ]
            }
        },
        tsng: {
            options: {
                cwd: "tests"
            },
            test: {
                files: [
                    {
                        expand: true,
                        cwd: "tests",
                        src: ["*/actual/**/*.ts", "!**/*.ng.ts"],
                        dest: "tests",
                        rename: function (dest, src) {
                            var parts = src.split("/");
                            var testName = parts[0];
                            var newDest = dest + "/" + testName + "/actual";
                            return newDest;
                        }
                    }
                ]
            }
        },
        compare: {
            test: {
                files: [
                    {
                        expand: true,
                        cwd: "tests",
                        src: "*/expected",
                        dest: "tests",
                        rename: function (dest, src) {
                            var newDest = dest + "/" + src.replace("/expected", "/actual");
                            return newDest;
                        }
                    }
                ]
            }
        }
    });

    grunt.loadTasks("tasks");
    grunt.loadTasks("tests");

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-typescript");

    grunt.registerTask("test", ["clean:test", "copy:test", "tsng:test", "compare:test"]);

    grunt.registerTask("default", ["jshint"]);
};