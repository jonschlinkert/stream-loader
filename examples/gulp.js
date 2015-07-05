'use strict';

var gulp = require('gulp');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * convert stream-loader files into vinyl files
 */
var src = loader(utils.toVinyl);

gulp.src('*.js')
  .pipe(gulp.src('*.json'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(utils.contents())
  .pipe(gulp.dest('actual/'));
