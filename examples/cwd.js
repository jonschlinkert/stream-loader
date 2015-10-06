'use strict';

var through = require('through2');
var contents = require('file-contents');
var dest = require('dest');
var utils = require('./utils');
var loader = require('..');

/**
 * Convert files to vinyl files
 */

var src = loader({read: true}, function (options) {
  return through.obj(utils.toVinyl(options));
});

src('*.json')
  .pipe(src('*.txt', {cwd: 'test/fixtures'}))
  .pipe(src('*.md', {cwd: 'test/fixtures'}))
  .pipe(contents())
  .pipe(through.obj(function (file, enc, next) {
    console.log(file.path);
    console.log(file.contents);
    next(null, file);
  }))
