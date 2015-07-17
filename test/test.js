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
var dest = require('dest');
var rimraf = require('rimraf');

var contents = require('file-contents');
var symlinks = require('file-symlinks');
var utils = require('../lib/utils');
var loader = require('../');

describe('loader', function () {
  it('should return a function:', function () {
    assert.equal(typeof loader(), 'function');
  });

  it('should read a glob of files:', function (done) {
    var src = loader();

    src('test/fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), false);
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
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
      .pipe(utils.drain(done));
  });

  it('should take a callback on the loader:', function (done) {
    var src = loader(function (stream, options) {
      return stream
        .pipe(through.obj(function (file, enc, cb) {
          file.foo = 'bar';
          this.push(utils.toVinyl(file));
          return cb();
        }));
    });

    src('test/fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file.foo, 'bar');
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
  });

  it('should convert the file to a vinyl File object:', function (done) {
    var src = loader(function (stream, options) {
      return stream
        .pipe(through.obj(function (file, enc, cb) {
          this.push(utils.toVinyl(file));
          return cb();
        }));
    });

    src('test/fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file instanceof File, true);
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
  });

  it('should support chaining src streams:', function (done) {
    var src = loader();

    var a = [], b = [], c = [];

    src('test/fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        a.push(file.path);
        this.push(file);
        cb();
      }))
      .pipe(src('test/fixtures/*.md'))
      .pipe(through.obj(function (file, enc, cb) {
        b.push(file.path);
        this.push(file);
        cb();
      }))
      .pipe(src('test/fixtures/*.js'))
      .pipe(through.obj(function (file, enc, cb) {
        c.push(file.path);
        this.push(file);
        cb();
      }))
      .on('end', function () {
        assert.equal(a.length, 3);
        assert.equal(b.length, 6);
        assert.equal(c.length, 9);
      })
      .pipe(utils.drain(done));
  });

  it('should support plugins used in the loader:', function (done) {
    var src = loader(function (stream, options) {
      return stream
        .pipe(symlinks({realpath: false}))
        .pipe(contents())
    });

    var a = [], b = [], c = [];

    src('test/fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        a.push(file.path);
        this.push(file);
        cb();
      }))
      .pipe(src('test/fixtures/*.md'))
      .pipe(through.obj(function (file, enc, cb) {
        b.push(file.path);
        this.push(file);
        cb();
      }))
      .pipe(src('test/fixtures/*.js'))
      .pipe(through.obj(function (file, enc, cb) {
        c.push(file.path);
        this.push(file);
        cb();
      }))
      .on('end', function () {
        assert.equal(a.length, 3);
        assert.equal(b.length, 6);
        assert.equal(c.length, 9);
      })
      .pipe(utils.drain(done));
  });

  it('should use plugins in the loader:', function (done) {
    this.timeout(5000);

    var src = loader({read: true}, function (stream, opts) {
      return utils.base(stream, opts, function (file, options) {
        return utils.toVinyl(file, options);
      });
    });

    var i = 0;

    src('node_modules/**/*')
      .pipe(src('lib/**/*.js'))
      .pipe(src('test/fixtures/*.txt'))
      .pipe(src('test/fixtures/**/*.txt'))
      .pipe(src('test/fixtures/**/*.md'))
      .pipe(src('test/fixtures/**/*.js'))
      .pipe(through.obj(function (file, enc, cb) {
        i++;
        this.push(file);
        return cb();
      }))
      .on('end', function () {
        console.log('read', i, 'files');
      })
      .pipe(utils.drain(done));
  });

  it('should push files into a vinyl src stream:', function (done) {
    var src = loader(function (stream, options) {
      return stream
        .pipe(through.obj(function (file, enc, cb) {
          this.push(utils.toVinyl(file));
          return cb();
        }));
    });

    var files = {};
    gulp.src('*.js')
      .pipe(src('test/fixtures/*.txt'))
      .pipe(src('test/fixtures/*.md'))
      .pipe(through.obj(function (file, enc, cb) {
        files[file.path] = file;
        this.push(file);
        cb();
      }))
      .pipe(dest('actual'))
      .on('end', function() {
        assert.equal(Object.keys(files).length > 1, true);
        rimraf('actual', done);
      });
  });

  it('should passthrough files when no pattern is given', function (done) {
    var src = loader();

    var files1 = [], files2 = [];
    src('test/fixtures/*.txt')
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
      .pipe(utils.drain(done));
  });
});
