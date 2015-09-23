var browserSync = require('browser-sync');
var gulp        = require('gulp');

gulp.task('browserSync', ['build'], function() {
  browserSync({
    https: true,
    server: {
      // src is included for use with sass source maps
      baseDir: ['build', 'src'],
      https: true
    },
    notify: false,
  
    files: [
      // Watch everything in build
      "build/**"

    ]
  });
});
