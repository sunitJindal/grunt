var dirList = {
      srcJs: 'public/resources/js/', //source path for js files
      srcCss: 'public/resources/css/', //source path for css files
      distCss: 'dist/public/resources/css', //distribution directory path for css
      distJs: 'dist/public/resources/js', //distribution directory for javascript files
      srcLess: 'dist/public/resources/less/src', //source directory for LESS files, all files in directory will be compiled
      srcJade: 'app/views/', //source path for jade files
      distJade: 'dist/views/', //distribution path for jade file
      srcAssets: 'public/resources/', //source path for static resources
      distAssets: 'dist/public/resources/' //distribution path for static resources 
    },
    config = {
      /**
       * @description - list of assets which will versioned as per their hash
       * @type {Array}
       */
      assetsSrc: [
        'css/**/*.css',
        'js/**/*.js'
      ],
      indexSrc: [
        'dist/views/**/*.jade'
      ],
      /**
       * @description - object for pattern of the assets in config.indexSrc file list
       */
      matchingPattern: {

      }
    }


module.exports = function (grunt) {

  var env = process.env.NODE_ENV || 'dev',
      concurrentTasks = [],
      prepareTasks = ['clean', 'copy', 'less'];

  if (env == 'dev') {
    concurrentTasks = ['watch', 'nodemon']
  } else {
    prepareTasks.push('uglify')
    prepareTasks.push('cssmin')
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist/'],
    copy: {
      main: {
        //nonull : true,
        files: [
          {
            expand: true,
            cwd: dirList.srcAssets,
            src: ['**'],
            dest: dirList.distAssets
          },
          {
            expand: true,
            cwd: dirList.srcJade,
            src: ['**'],
            dest: dirList.distJade
          }
        ]
      }
    },
    filerev: {
      options: {
        algorithm: 'md5',
        length: 8
      },
      assets: {
//        src: config.assetsSrc
        expand: true,
        cwd: dirList.distAssets,
        src: config.assetsSrc,
        dest: dirList.distAssets
      }
    },
    /**
     * Update index files as per the file revision summary
     */
    userev: {
      index: {
        src: config.indexSrc,
        options: {
          patterns: config.matchingPattern
        }
      }
    },
    less: {
      development: {
        options: {
        },
        files: [
          {
            expand: true,
            cwd: dirList.srcLess,
            src: ['*.less'],
            dest: dirList.distCss,
            ext: '.css'
          }
        ]
      }
    },
    watch: {
      statics: {
        files: ['public/**/*', 'app/**/*.jade'],
        tasks: ['prepare', 'version'],
        options: {
          event: ['all'],
          reload: true
        }
      },
      appFiles: {
        files: ['app/**/*', '!app/**/*.jade'],
        tasks: ['nodemon'],
        options: {
          spawn: false
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          delay: 2000
        }
      }
    },
    concurrent: {
      default: concurrentTasks,
      options: {
        logConcurrentOutput: true
      }
    },
    uglify: {
      my_target: {
        files: [
          {
            expand: true,
            cwd: dirList.distJs,
            src: '**/*.js',
            dest: dirList.distJs
          }
        ]
      }
    },
    cssmin: {
      target: {
        options: {
          keepSpecialComments: 0
        },
        files: [
          {
            expand: true,
            cwd: dirList.distCss,
            src: ['*.css'],
            dest: dirList.distCss,
            ext: '.css'
          }
        ]
      }
    }
  })

  require('load-grunt-tasks')(grunt);


  /**
   * Registering revision preparing task
   * @description - create matching pattern regex from file revision history
   */
  grunt.registerTask('revPrepare', 'Add the files to pattern', function () {
    var history = grunt.filerev.summary;
    var i = 0, fileName;
    console.log(history)
    for (var key in history) {
      fileName = key.lastIndexOf('\\') > 0 ? key.substr(key.lastIndexOf('\\') + 1) : key.substr(key.lastIndexOf('/') + 1);
      console.log(fileName)
      config.matchingPattern['Asset count ' + i] = new RegExp('resources[a-zA-Z0-9.\/]*' + fileName, 'g');
      i += 1;
    }
    grunt.log.writeln(i + 'pattern added');
  });

  grunt.registerTask('prepare', prepareTasks)
  grunt.registerTask('version', ['filerev', 'revPrepare', 'userev'])
  grunt.registerTask('default', [ 'prepare', 'version', 'concurrent'])
}
