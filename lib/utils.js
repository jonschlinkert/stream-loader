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
 * Convert an object to a file object.
 *
 * @param  {Object} options
 * @return {Object}
 */

utils.toFile = function toFile(options) {
  options = options || {};
  var cwd = options.cwd || process.cwd();

  return through.obj(function (file, enc, cb) {
    file.base = options.base || typeof patterns === 'string'
      ? parent(patterns)
      : '.';

    if (options.cwd && typeof options.cwd === 'string') {
      file.path = path.resolve(options.cwd, file.orig);
    } else {
      file.path = path.resolve(file.orig);
    }

    file.options = options || {};
    file.cwd = file.options.cwd || process.cwd();
    file.options.orig = file.orig;
    delete file.orig;

    file.isNull = function () {
      return !this.contents;
    }.bind(file);

    file.isBuffer = function () {
      return Buffer.isBuffer(this.contents);
    }.bind(file);

    file.isStream = function () {
      return utils.isStream(file.contents);
    };

    this.push(file);
    return cb();
  });
};

/**
 * Add the `contents` property to a `file` object.
 *
 * @param  {Object} `options`
 * @return {Object} File object.
 */

utils.contents = function contents(options) {
  var config = extend({loader: {}}, options);

  return through.obj(function (file, enc, cb) {
    var opts = extend({}, config.loader, config, file.options);

    if (opts.noread === true || opts.read !== true) {
      this.push(file);
      return cb();
    }

    if (file.contents != null || file.isDirectory()) {
      this.push(file);
      return cb();
    }

    var stream = this;
    if (opts.buffer !== false) {
      return fs.readFile(file.path, function (err, data) {
        if (err) return cb(err);

        file.contents = data;
        stream.push(file);
        return cb();
      });
    }

    try {
      file.contents = fs.createReadStream(file.path);
      this.push(file);
      return cb();
    } catch (err) {
      return cb(err);
    }
  });
};

utils.stats = function stats() {
  return through.obj(function (file, enc, cb) {
    fs.lstat(file.path, function (err, stats) {
      if (err) return this.emit('error', err);

      Object.defineProperty(file, 'stat', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: stats
      });

      file.isDirectory = function () {
        return file.stat.isDirectory();
      };

      file.isFile = function () {
        return file.stat.isFile();
      };

      return cb(null, file);
    });
  });
};

utils.emitEvent = function emitEvent(event, stream) {
  return through.obj(function (data, enc, cb) {
    stream.emit(event, data);
    this.push(data);
    return cb();
  });
};

utils.listen = function listen(event, stream) {
  return through.obj(function (data, enc, cb) {

    stream.on(event, function (file) {
      if (event === 'preFile') {
        file.foo = 'bar';
      }
    });

    this.push(data);
    return cb();
  });
};

/**
 * Return true if the given object is a stream.
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
