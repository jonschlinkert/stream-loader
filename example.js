'use strict';

var through = require('through2');
var dest = require('dest');
var File = require('vinyl');
var loader = require('./');

/**
 * Example usage
 */

var src = loader(function (err, file, cb) {
  this.on('error', function (err) {
    return cb(err);
  });

  // console.error(file);
  return cb(null, new File(file));
});

// var read = require('./src');

// read('*.json')
//   .pipe(src('*.js'))
//   .pipe(src('*.txt', {cwd: 'fixtures'}))
//   .pipe(src('*.md', {cwd: 'fixtures'}))
//   .pipe(through.obj(function (file, enc, cb) {
//     console.log(file.path);
//     this.push(file);
//     cb();
//   }))
//   .pipe(dest('actual/'));

src([])
  .pipe(src('*.js'))
  .pipe(through.obj(function (file, enc, cb) {
    // console.log(file.path);
    this.push(file);
    cb();
  }))
  .pipe(dest('actual/'));
