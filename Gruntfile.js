module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                files: {
                    'dist/subview.js':      ['src/main.js'],
                    'examples/build.js':    ['examples/example.js']
                },
                options: {
                    standalone: 'onKey'
                }
            },
            test: {
                files: {
                    'test/build.js':        ['test/test.js']
                }
            }
        },
        watch: {
            files: [ "src/**/*", "examples/example.js"],
            tasks: [ 'browserify:dist' ]
        },
        jshint: {
            options: {
                curly:  true,
                eqeqeq: true,
                eqnull: true,
                browser: true
            },
            uses_defaults: ['src/**/*.js']
        },
        uglify: {
            dist: {
                files: {
                    'dist/lib.min.js': ['dist/lib.js']
                }
            }
        },
        qunit: {
            files: ['test/index.html']
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', [
        'browserify:test',
        'qunit',
        'jshint'
    ]);

    grunt.registerTask('build', [
        'test',
        'browserify:dist',
        'uglify'
    ]);
};

