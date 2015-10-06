'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var through = require('through2');
var stylish = require('jshint-stylish');
var contents = require('file-contents');
var loader = require('..');

/**
 * convert stream-loader files into vinyl files
 */

var src = loader({read: true}, function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(file);
    return cb();
  });
});

gulp.src('lib/*.js')
  .pipe(src('*.js'))
  .pipe(contents())
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
  // .pipe(gulp.dest('actual/'))
