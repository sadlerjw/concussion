var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  plumber = require('gulp-plumber'),
  livereload = require('gulp-livereload'),
  less = require('gulp-less'),
  env = require('gulp-env');

gulp.task('less', function () {
  gulp.src('./public/css/*.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  gulp.watch('./public/css/*.less', ['less']);
});

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'bin/www',
    ext: 'js handlebars coffee md',
  }).on('restart', function () {
    setTimeout(function () {
      livereload.changed(__dirname);
    }, 1500);
  });
});

gulp.task('set-env', function () {
  env({
    vars: {
      BLOG_TITLE: "Example blog",
      BLOG_AUTHOR_NAME: "Jason Sadler",
      BLOG_AUTHOR_TWITTER: "sadlerjw",
      BLOG_DESCRIPTION: "An example blog using Concussion",
      NODE_ENV: "development"
    }
  })
});

gulp.task('default', [
  'set-env',
  'less',
  'develop',
  'watch'
]);
