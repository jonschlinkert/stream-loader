'use strict';

require('jshint-stylish');
var through = require('through2');
var jshint = require('gulp-jshint');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Convert files to vinyl files
 */

// var src = loader(utils.toVinyl);
var src = loader({read: true}, function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(file);
    return cb();
  })
});

src('lib/*.js')
  .pipe(src('*.js'))
  .pipe(utils.contents())
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(utils.debug());
