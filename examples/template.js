'use strict';

var dest = require('dest');
var contents = require('file-contents');
var through = require('through2');
var utils = require('../lib/utils');
var loader = require('..');

var App = require('template');
var app = new App();

var src = loader(function (options) {
  return through.obj(function (file, enc, cb) {
    this.push(utils.toVinyl(file));
    return cb();
  })
});


src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(contents())
  .pipe(src('fixtures/*.md'))
  .pipe(through.obj(function (file, enc, cb) {
    console.log(file.path)
    this.push(file);
    cb();
  }))
  .pipe(dest('actual/'));
