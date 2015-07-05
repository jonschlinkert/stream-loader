'use strict';

var through = require('through2');
var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Example usage
 */

var src = loader(function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(utils.toVinyl(file));
    return cb();
  })
});

src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(utils.contents())
  .pipe(dest('actual/'))
