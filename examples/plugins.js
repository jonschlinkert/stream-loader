'use strict';

var jshint = require('gulp-jshint');
var contents = require('file-contents');
var stylish = require('jshint-stylish');
var loader = require('..');

/**
 * Convert files to vinyl files
 */

var src = loader();

src('lib/*.js')
  .pipe(src('*.js'))
  .pipe(contents())
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
