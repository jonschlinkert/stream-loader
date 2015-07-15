'use strict';

var path = require('path');
var File = require('vinyl');
var extend = require('extend-shallow');
var parent = require('glob-parent');
var Stream = require('stream').Stream;
var isObject = require('is-extendable');
var through = require('through2');
var mixin = require('mixin-object');
var fs = require('graceful-fs');

/**
 * Utils
 */

var utils = module.exports;

/**
 * Return the first argument passed, as-is.
 */

utils.identity = function identity(val) {
  return val;
};

/**
 * Base plugin function
 */

utils.base = function base(stream, options, fn) {
  return stream
    .pipe(through.obj(function (file, enc, cb) {
      if (typeof fn === 'function') {
        file = fn.call(this, file, options);
      }
      this.push(file);
      return cb();
    }));
};

/**
 * Cast the given value to an array.
 *
 * @param  {*} val
 * @return {Array}
 */

utils.arrayify = function arrayify(val) {
  return val = Array.isArray(val) ? val : [val];
};

/**
 * Create a vinyl file in the loader callback.
 *
 * @param  {Object} file
 * @param  {Object} end
 * @param  {Function} cb
 * @return {Object}
 */

utils.toVinyl = function toVinyl(data) {
  if (data instanceof File) {
    return data;
  }
  var file = new File(data);
  mixin(file, data);
  return file;
};

/**
 * Make sure all the data is pulled through a stream
 *
 * @param  {Function} `done`
 * @return {Stream}
 */

utils.drain = function drain(done) {
  var stream = through.obj();
  stream.on('end', done);
  stream.resume();
  return stream;
};

/**
 * Convert a data object to a basic file object.
 *
 * @param  {Object} `options`
 * @return {Object}
 */

utils.toFile = function toFile(fp, pattern, options) {
  options = options || {};
  var cwd = options.cwd || process.cwd();

  var file = {};
  file.options = options;
  file.options.orig = fp;
  file.path = path.resolve(fp);
  file.base = options.base;

  if (!file.base && typeof pattern === 'string') {
    file.base = parent(pattern);
  }

  file.contents = null;
  return file;
};

/**
 * Returns a string.
 *
 * @param  {String} `pattern`
 * @param  {Object} `options`
 * @return {Stream}
 */

utils.toFileObject = function toFileObject(pattern, options) {
  options = options || {};
  var cwd = options.cwd || process.cwd();

  return through.obj(function (file, enc, cb) {
    file.path = path.resolve(file.orig);
    file.options = options || {};
    file.options.orig = file.orig;
    delete file.orig;

    file.cwd = file.cwd || cwd;
    file.base = file.base || options.base;

    if (!file.base && typeof pattern === 'string') {
      file.base = parent(pattern);
    }

    file.base = file.base || file.cwd;
    file.stat = file.stat || null;
    file.contents = file.contents || null;

    utils.decorate.call(this, file);
    this.push(file);
    return cb();
  });
};

/**
 * Decorate a file object with convenience methods.
 *
 * @param  {Object} `file`
 * @return {Object}
 */

utils.decorate = function decorate(file) {
  this.isNull = function () {
    return !this.contents;
  }.bind(this);

  this.isBuffer = function () {
    return Buffer.isBuffer(this.contents);
  }.bind(this);

  this.isStream = function () {
    return utils.isStream(this.contents);
  };

  mixin(file, this);
  return file;
};


/**
 * Return true if the given value is a buffer.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isBuffer = function isBuffer(val) {
  return val && Buffer.isBuffer(val);
};

/**
 * Return true if the given value is `null`
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isNull = function isNull (val) {
  return val === null;
};

/**
 * Return true if the given value is a stream.
 *
 * @param  {Object} `val`
 * @return {Boolean}
 */

utils.isStream = function isStream (val) {
  return !!val && isObject(val)
    && typeof val.pipe === 'function'
    && val instanceof Stream;
};

/**
 * Debug a file object
 */

utils.debug = function debug() {
  return through.obj(function (file, enc, cb) {
    console.log(file.path);
    this.push(file);
    return cb();
  });
};
