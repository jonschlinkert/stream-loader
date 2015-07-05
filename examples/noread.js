'use strict';

var through = require('through2');
var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Should not read file contents.
 */

// var src = loader({noread: true}, utils.toVinyl);
var src = loader({noread: true}, function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(file);
    return cb();
  })
});

src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(utils.contents())
  .pipe(dest('actual/'))
