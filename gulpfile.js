/*
  Adapted version of this gist by Fishrock123:

  https://gist.github.com/Fishrock123/8ea81dad3197c2f84366
*/

'use strict';

var gulp = require('gulp');

var babelify = require('babelify');
var browserify = require('browserify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');


function bundle_js(bundler) {
  return bundler.bundle()
    .pipe(source('WebMIDIAPI.js'))
    .pipe(buffer())
    .pipe(gulp.dest('lib'))
    .pipe(rename('WebMIDIAPI.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
      // capture sourcemaps from transforms
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));
}

gulp.task('build', function () {
  var bundler = browserify('./src/shim.js', { debug: true }).transform(babelify, {/* options */ });
  return bundle_js(bundler);
});

// Without sourcemaps
gulp.task('build-nodejs', function () {
  var bundler = browserify('./src/shim.js').transform(babelify, {/* options */ });

  return bundler.bundle()
    .pipe(source('WebMIDIAPI.js'))
    .pipe(buffer())
    .pipe(rename('WebMIDIAPI.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('web-midi-api'));
});