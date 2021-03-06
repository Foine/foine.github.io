/*
 * Based on Bootstrap's Gruntfile
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs');
  var path = require('path');
  var glob = require('glob');
  var mq4HoverShim = require('mq4-hover-shim');

  var pkg = grunt.file.readJSON('package.json');

  var assets_path = '../assets/';

  var scss_source = grunt.option('scss_source') || 'styles';

  var dependencies = grunt.file.readJSON('dependencies.json');
  var js_files = dependencies.js_dependencies.concat([assets_path+'/js/'+pkg.js_name+'_src.js']);

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: pkg,
    scss_source:scss_source,
    js_files:js_files,
    banner: '/*!\n' +
    ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
    ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
    ' * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)\n' +
    ' */\n',
    jqueryCheck: 'if (typeof jQuery === \'undefined\') {\n' +
    '  throw new Error(\'Bootstrap\\\'s JavaScript requires jQuery\')\n' +
    '}\n',
    jqueryVersionCheck: '+function ($) {\n' +
    '  var version = $.fn.jquery.split(\' \')[0].split(\'.\')\n' +
    '  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1)) {\n' +
    '    throw new Error(\'Bootstrap\\\'s JavaScript requires jQuery version 1.9.1 or higher\')\n' +
    '  }\n' +
    '}(jQuery);\n\n',

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>',
        stripBanners: false
      },
      bootstrap: {
        src: js_files,
        dest: assets_path+'/js/<%= pkg.js_name %>.js'
      }
    },

    uglify: {
      options: {
        compress: {
          warnings: false
        },
        mangle: true,
        preserveComments: 'some'
      },
      core: {
        src: '<%= concat.bootstrap.dest %>',
        dest: assets_path+'/js/<%= pkg.js_name %>.min.js'
      }
    },

    postcss: {
      options: {
        map: true,
        processors: [mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' })]
      },
      core: {
        src: assets_path+'/style/<%= scss_source %>.css'
      }
    },

    autoprefixer: {
      options: {
        browsers: [
          'Android 2.3',
          'Android >= 4',
          'Chrome >= 35',
          'Firefox >= 31',
          'Explorer >= 9',
          'iOS >= 7',
          'Opera >= 12',
          'Safari >= 7.1'
        ]
      },
      core: {
        options: {
          map: true
        },
        src: assets_path+'/style/<%= scss_source %>.css'
      }
    },

    cssmin: {
      options: {
        // TODO: disable `zeroUnits` optimization once clean-css 3.2 is released
        //    and then simplify the fix for https://github.com/twbs/bootstrap/issues/14837 accordingly
        compatibility: 'ie9',
        keepSpecialComments: '*',
        sourceMap: true,
        advanced: false
      },
      core: {
        src: assets_path+'/style/<%= scss_source %>.css',
        dest: assets_path+'/style/<%= scss_source %>.min.css'
      }
    },

    watch: {
      src: {
        files: '<%= concat.bootstrap.src %>',
        tasks: ['js']
      },
      sass: {
        files: 'scss/**/*.scss',
        tasks: ['css']
      },
    },

    bless: {
      css: {
        options: {
          cacheBuster: false,
          compress: true
        },
        files: {
          '<%= assets_path %>/style/ie9.css': '<%= cssmin.core.dest %>'
        }
      }
    },

    exec: {
      npmUpdate: {
        command: 'npm update'
      }
    }

  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, { scope: 'devDependencies',
    // Exclude Sass compilers. We choose the one to load later on.
    pattern: ['grunt-*', '!grunt-sass', '!grunt-contrib-sass'] });
  require('time-grunt')(grunt);


  // CSS distribution task.
  // Supported Compilers: sass (Ruby) and libsass.
  (function (sassCompilerName) {
    require('./grunt/bs-sass-compile/' + sassCompilerName + '.js')(grunt);
  })(process.env.TWBS_SASS || 'libsass');

  grunt.registerTask('sass-compile', ['sass:core']);

  grunt.registerTask('css', ['sass-compile', 'postcss:core', 'autoprefixer:core', 'cssmin:core', 'bless']);

  grunt.registerTask('js', ['concat', 'uglify']);

  // Default task.
  grunt.registerTask('default', ['css', 'js']);

};
