/*
 * grunt-tsng
 * https://github.com/DamianEdwards/grunt-tsng
 *
 * Copyright (c) 2014 Damian Edwards
 * Licensed under the Apache 2.0 License.
 */

"use strict";

module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			all: [
				"Gruntfile.js",
				"tasks/**/*.js"
			]
		}
	});

	grunt.loadTasks("tasks");

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-clean");

	grunt.registerTask("default", ["jshint"]);
};