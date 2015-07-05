'use strict';

var File = require('vinyl');
var through = require('through2');
var fs = require('graceful-fs');

var utils = module.exports;

/**
 * Create a vinyl file in the loader callback.
 *
 * @param  {Object} file
 * @param  {Object} options
 * @param  {Function} cb
 * @return {Object}
 */

utils.toVinyl = function toVinyl(file, options, cb) {
  return cb(null, new File(file));
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
 * Set the `contents` property on a `file` object.
 *
 * @param  {Object} `options`
 * @return {Object} File object.
 */

utils.contents = function contents(options) {
  options = options || {};

  return through.obj(function (file, enc, cb) {
    fs.lstat(file.path, function (err, stats) {
      if (err) return cb(err);

      file.stat = stats;
      if (file.isDirectory()) {
        return cb(null, file);
      }

      if (options.buffer !== false) {
        return fs.readFile(file.path, function (err, data) {
          if (err) return cb(err);

          file.contents = data;
          return cb(null, file);
        });
      }

      try {
        file.contents = fs.createReadStream(file.path);
        return cb(null, file);
      } catch (err) {
        return cb(err);
      }
    });
  });
};

utils.stats = function stats() {
  return through.obj(function (file, enc, cb) {
    fs.lstat(file.path, function (err, stats) {
      if (err) return cb(err);

      file.stat = stats;
    });
  });
};

/**
 * Debug a file object
 */

utils.debug = function debug() {
  return through.obj(function (file, enc, cb) {
    console.log(file.path);
    this.push(file);
    cb();
  });
};
