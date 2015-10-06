'use strict';

var through = require('through2');
var contents = require('file-contents');
var dest = require('dest');
var loader = require('..');

/**
 * Should not read file contents.
 */

var src = loader({noread: true});

src('*.json')
  .pipe(src('*.js'))
  .pipe(src('test/fixtures/*.txt'))
  .pipe(src('test/fixtures/*.md'))
  .pipe(contents())
  .pipe(through.obj(function (file, enc, next) {
    console.log(file.path);
    console.log(file.contents);
    next(null, file);
  }))
