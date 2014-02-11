module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            'dist/lib.js':          ['src/main.js'],
            'examples/build.js':    ['examples/example.js']
        },
        watch: {
            files: [ "src/**/*", "examples/example.js"],
            tasks: [ 'browserify' ]
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
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};

