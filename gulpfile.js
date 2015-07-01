'use strict';

var through = require('through2');
var gulp = require('gulp');
var File = require('vinyl');
var loader = require('./');
var dest = require('dest');

/**
 * Example usage with gulp
 */

var src = loader(function (err, file, cb) {
  return cb(null, new File(file));
});

gulp.task('default', function () {
  gulp.src('*.js')
    .pipe(src('fixtures/*.txt'))
    .pipe(src('fixtures/*.md'))
    .pipe(through.obj(function (file, enc, cb) {
      console.log(file.path);
      this.push(file);
      cb();
    }))
    .pipe(dest('foo'))
});
