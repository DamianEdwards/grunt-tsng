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
                "tasks/**/*.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        test: {
            files: {
                src: "tests"
            }
        }
    });

    grunt.loadTasks("tasks");
    grunt.loadTasks("tests");

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-typescript");

    grunt.registerTask("default", ["jshint"]);
};