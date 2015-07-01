/*!
 * stream-loader <https://github.com/jonschlinkert/stream-loader>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

/* deps: mocha */
var assert = require('assert');
var through = require('through2');
var gulp = require('gulp');
var File = require('vinyl');
var loader = require('./');
var dest = require('dest');
var del = require('del');

describe('loader', function () {
  it('should return a function:', function () {
    assert.equal(typeof loader(), 'function');
  });

  it('should read a glob of files:', function () {
    var src = loader();
    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), true);
        this.push(file);
        cb();
      }))
  });

  it('should pass options to `glob`:', function () {
    var src = loader();
    src('*.txt', {cwd: 'fixtures'})
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), true);
        this.push(file);
        cb();
      }))
  });

  it('should take a callback on the loader:', function () {
    var src = loader(function (file, options) {
      file.foo = 'bar';
      return file;
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file.foo, 'bar');
        this.push(file);
        cb();
      }))
  });

  it('should convert the file to a vinyl File object:', function () {
    var src = loader(function (file, options) {
      return new File(file);
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(Buffer.isBuffer(file.contents), true);
        this.push(file);
        cb();
      }))
  });

  it('should push files into a vinyl src stream:', function (done) {
    var src = loader(function (file, options) {
      return new File(file);
    });

    gulp.src('*.js')
      .pipe(src('fixtures/*.txt'))
      .pipe(src('fixtures/*.md'))
      .pipe(through.obj(function (file, enc, cb) {
        console.log(file.path);
        this.push(file);
        cb();
      }))

      .pipe(dest('foo'))
      .on('end', function() {
        del('temp', done);
      })
  });
});
