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

    grunt.registerMultiTask("test", "", function () {
        
        this.files.forEach(function (fileset) {
            fileset.src.forEach(function (filepath) {
                if (!grunt.file.isDir(filepath)) {
                    return true;
                }

                var testRootDir = path.resolve(filepath);

                grunt.log.writeln("Discovered test folders:");
                getDirs(testRootDir).forEach(function (testDir) {
                    grunt.log.writeln("   " + testDir);
                });
            });
        });

    });

    function getDirs (rootDir) {
        var files = fs.readdirSync(rootDir);
        var dirs = [];
        var filePath, stat;

        files.forEach(function (file) {
            if (file[0] !== ".") {
                filePath = rootDir + "\\" + file;
                
                stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    dirs.push(filePath);
                }
            }
        });

        return dirs;
    }
};