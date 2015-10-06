'use strict';

var File = require('vinyl');
var through = require('through2');

/**
 * Expose test support utils
 */

var utils = module.exports;

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
 * Create a vinyl file in the loader callback and mixin non-vinyl
 * properties that are lost in the conversion.
 *
 * @param  {Object} file
 * @param  {Object} end
 * @param  {Function} cb
 * @return {Object}
 */

utils.toVinyl = function toVinyl(data) {
  if (File.isVinyl(data)) {
    return data;
  }
  var file = new File(data);
  mixin(file, data);
  return file;
};
