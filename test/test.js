/*!
 * stream-loader <https://github.com/jonschlinkert/stream-loader>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

/* deps: mocha */
var path = require('path');
var assert = require('assert');
var through = require('through2');
var gulp = require('gulp');
var File = require('vinyl');
var vfs = require('vinyl-fs');
var dest = require('dest');
var del = require('del');

// var contents = require('file-contents');
var utils = require('../lib/utils');
var loader = require('../');

describe('loader', function () {
  it('should return a function:', function () {
    assert.equal(typeof loader(), 'function');
  });

  it('should read a glob of files:', function (done) {
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        return cb();
      })
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(typeof file.path, 'string');
        assert.equal(Buffer.isBuffer(file.contents), false);
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
  });

  it('should pass options to `glob`:', function (done) {
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        return cb();
      });
    });

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
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        file.foo = 'bar';
        this.push(utils.toVinyl(file));
        return cb();
      })
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file.foo, 'bar');
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
  });

  it('should convert the file to a vinyl File object:', function (done) {
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        this.push(utils.toVinyl(file));
        return cb();
      })
    });

    src('fixtures/*.txt')
      .pipe(through.obj(function (file, enc, cb) {
        assert.equal(file instanceof File, true);
        this.push(file);
        cb();
      }))
      .pipe(utils.drain(done));
  });

  it('should add the contents property to a file object:', function (done) {
    this.timeout(5000);

    var src = loader({read: true}, function (opts) {
      return utils.base(opts, function (file, options) {
        return utils.toVinyl(file, options);
      });
    });

    var i = 0;

    src('node_modules/**/*')
      .pipe(src('lib/**/*.js'))
      .pipe(src('fixtures/*.txt'))
      .pipe(src('fixtures/**/*.txt'))
      .pipe(src('fixtures/**/*.md'))
      .pipe(src('fixtures/**/*.js'))
      // .pipe(contents({read: false}))
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
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        this.push(utils.toVinyl(file));
        return cb();
      })
    });

    var files = {};
    gulp.src('*.js')
      .pipe(src('fixtures/*.txt'))
      .pipe(src('fixtures/*.md'))
      .pipe(through.obj(function (file, enc, cb) {
        files[file.path] = file;
        this.push(file);
        cb();
      }))
      .pipe(dest('actual'))
      .on('end', function() {
        assert.equal(Object.keys(files).length > 1, true);
        del('actual', done);
      });
  });

  it('should passthrough files when no pattern is given', function (done) {
    var src = loader(function (options) {
      return through.obj(function (file, enc, cb) {
        return cb();
      })
    });

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
      .pipe(utils.drain(done));
  });
});
