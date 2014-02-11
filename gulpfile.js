'use strict';

var browserify = require('gulp-browserify');
var gulp = require('gulp');
var gutil = require('gulp-util');
var lr = require('tiny-lr');
var path = require('path');
var pkg = require('./package.json');
var refresh = require('gulp-livereload');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap-umd');

var server = lr();


/*
 * Main tasks
 */

gulp.task('dist', function() {
  if (gutil.env.type !== 'production') {
    throw new Error('This task only works with the --type=production option');
  }
  gulp.start('uglify');
});

/*
 * Browserify
 */

gulp.task('browserify', function() {
  var production = gutil.env.type === 'production';

  // If this isn't a production build, include the tests
  var sources = ['index.js'].concat([production ? '' : 'tests/index.js']);

  gulp.src(sources, {read: false})

    // Browserify, and add source maps if this isn't a production build
    .pipe(browserify({debug: !production}))

    .on('prebundle', function(bundler) {
      if (production) {
        // Externalize underscore
        bundler.external('underscore');

        // Export the Router (using a __dirname workaround because
        // the value './index.js' doesn't work)
        bundler.require(path.resolve(__dirname, 'index.js'), {expose: 'itinerary'});
      }
    })

    // Rename the destination file
    .pipe(rename(pkg.name + '.js'))

    // Wrap in UMD if production
    .pipe(production ? wrap({
      deps: ['require', 'exports', 'module', 'underscore'],
      params: ['require', 'exports', 'module', '_'],
      namespace: 'Itinerary.Router'
    }) : gutil.noop())

    // Dist directory if production, otherwise the ignored build dir
    .pipe(gulp.dest(production ? 'dist/' : 'build/'));
});

/*
 * Uglify
 */

gulp.task('uglify', ['browserify'], function() {
  gulp.src('dist/' + pkg.name + '.js')
    .pipe(uglify())
    .pipe(rename(pkg.name + '.min.js'))
    .pipe(gulp.dest('dist/'));
});
