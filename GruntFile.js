module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jslint: {
            scripts: {
                src: ['scripts/*.js'],
                directives: {
                        bitwise: true,  // allow bitwise operators
                        browser: true,  // assume globals like window and setTimeout
                        nomen: true,    // tolerate dangling _
                        unparam: true,  // tolerate unused parameters
                        todo: true,     // tolerate to do comments
                        plusplus: true, // tolerate ++ and --
                        predef: ['_', 'jQuery'],
                        regexp: true
                }
            }
        },
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['jslint'],
                options: {
                    spawn: false,
                    livereload: true
                },
            },
        },
        connect: {
            server: {
                options: {},
            
            },
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['connect', 'watch']);

};