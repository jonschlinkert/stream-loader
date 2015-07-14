'use strict';

var through = require('through2');
// var contents = require('file-contents');
var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Example usage
 */

var src = loader(function (options) {
  return through.obj(function (file, enc, cb) {
    // console.log('fn', file.path);
    this.push(file);
    return cb();
  })
});

// src('fixtures/*.md')
// src('*.json')
src('*.js')
  // .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  // .pipe(contents())
  // .pipe(through.obj(function (file, enc, cb) {
  //   console.log(file)
  //   this.push(file);
  //   return cb();
  // }))
  .on('error', console.error)
  .on('data', function (file) {
    console.log(file.path);
  })
  .on('end', function () {
    console.log('example done');
  })
  // .pipe(dest('actual/'))
