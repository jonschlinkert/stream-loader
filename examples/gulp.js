'use strict';

var gulp = require('gulp');
var toVinyl = require('./to-vinyl');
var contents = require('../contents');
var loader = require('..');

/**
 * convert stream-loader files into vinyl files
 */
var src = loader(toVinyl);

gulp.src('*.js')
  .pipe(gulp.src('*.json'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(contents())
  .pipe(gulp.dest('actual/'));
