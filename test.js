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

  it('should read a glob of files:', function (done) {
    var src = loader();
    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), false);
        this.push(file);
        cb();
      }))
      .pipe(drain(done));
  });

  it('should pass options to `glob`:', function (done) {
    var src = loader();
    src('*.txt', {cwd: 'fixtures'})
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), false);
        this.push(file);
        cb();
      }))
      .pipe(drain(done));
  });

  it('should take a callback on the loader:', function (done) {
    var src = loader(function (file, options, cb) {
      file.foo = 'bar';
      cb(null, file)
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file.foo, 'bar');
        this.push(file);
        cb();
      }))
      .pipe(drain(done));
  });

  it('should convert the file to a vinyl File object:', function (done) {
    var src = loader(function (file, options, cb) {
      cb(null, new File(file));
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file instanceof File, true);
        this.push(file);
        cb();
      }))
      .pipe(drain(done));
  });

  it('should push files into a vinyl src stream:', function (done) {
    var src = loader(function (file, options, cb) {
      cb(null, new File(file));
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
        del('foo', done);
      })
  });

  it('should passthrough files when no pattern is given', function (done) {
    var src = loader();

    var files1 = [], files2 = [];
    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        files1.push(file);
        cb(null, file);
      }))
      .pipe(src([]))
      .pipe(through.obj(function (file, enc, cb) {
        files2.push(file);
        cb(null, file);
      }))
      .on('end', function () {
        assert.deepEqual(files1, files2);
      })
      .pipe(drain(done));
  });
});

// make sure all the data is pulled through a stream
function drain (done) {
  var stream = through.obj();
  stream.on('end', done);
  stream.resume();
  return stream;
}
