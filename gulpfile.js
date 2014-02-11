'use strict';

var browserify = require('gulp-browserify');
var gulp = require('gulp');
var gutil = require('gulp-util');
var lr = require('tiny-lr');
var pkg = require('./package.json');
var refresh = require('gulp-livereload');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var server = lr();

/*
 * Browserify
 */

gulp.task('browserify', function() {
  var production = gutil.env.type === 'production';

  // If this isn't a production build, include the tests
  var sources = ['./index.js'].concat([production ? '' : 'tests/index.js']);

  gulp.src(sources, {read: false})

    // Browserify, and add source maps if this isn't a production build
    .pipe(browserify({debug: !production}))

    // Rename the destination file
    .pipe(rename(pkg.name + '.js'))

    // Dist directory if production, otherwise the ignored build dir
    .pipe(gulp.dest(production ? 'dist/' : 'build/'))

    // If production, uglify
    .pipe(production ? uglify() : gutil.noop())

    // If production, rename the destination file with .min
    .pipe(production ? rename(pkg.name + '.min.js') : gutil.noop())

    // If production, set the final destination for the minified file
    .pipe(production ? gulp.dest('dist/') : gutil.noop());
});
