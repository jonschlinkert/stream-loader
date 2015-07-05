'use strict';

require('jshint-stylish');
var jshint = require('gulp-jshint');
var through = require('through2');
var gulp = require('gulp');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * convert stream-loader files into vinyl files
 */

// var src = loader(utils.toVinyl);
var src = loader({read: true}, function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(file);
    return cb()
  })
});

gulp.src('lib/*.js')
  .pipe(src('*.js'))
  .pipe(utils.contents())
  // .pipe(src('fixtures/*.txt'))
  // .pipe(src('fixtures/*.md'))
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  // .pipe(gulp.dest('actual/'))
