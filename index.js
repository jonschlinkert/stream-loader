'use strict';

var path = require('path');
var each = require('async-each');
var extend = require('extend-shallow');
var glob = require('globby');
var isValidGlob = require('is-valid-glob');
var through = require('through2');
var utils = require('./lib/utils');

/**
 * Stream loader that returns a function for creating a stream
 * from a glob of files.
 *
 * @param  {Object} config Options.
 * @param  {Function} `fn` Loader callback
 * @return {Function} Function for loading a glob of files.
 */

function streamLoader(config, fn) {
  if (typeof config === 'function') {
    fn = config; config = {};
  }

  return function (patterns, options) {
    var opts = extend({ loader: config }, options);
    return createStream(patterns, opts, fn);
  };
}

/**
 * Create a src stream from the given glob `patterns`,
 * `options` and optional transform `fn`.
 *
 * @param  {String|Array} `patterns` Glob patterns
 * @param  {Object} `options` Options to pass to [globby]
 * @param  {Function} `fn` The loader callback, can be thought of as a transform function.
 * @return {Stream}
 */

function createStream(patterns, options, fn) {
  patterns = arrayify(patterns);

  var isReading = false;

  // create the stream
  var stream = through.obj();
  stream.on('pipe', function (src) {
    isReading = true;
    src.on('end', function () {
      isReading = false;
      stream.end();
    });
  });

  var pass = through.obj();

  // if a loader callback is passed, bind the stream
  // and remove maxListeners
  if (typeof fn === 'function') {
    stream.setMaxListeners(0);
    fn = fn.bind(stream);
  }

  // if no patterns were actually passed, allow the next
  // plugin to keep processing
  if (!patterns.length) {
    process.nextTick(pass.end.bind(pass));
    stream.pipe(pass);
    return stream;
  }

  if (!isValidGlob(patterns)) {
    throw new Error('stream-loader: invalid glob pattern: ' + patterns);
  }

  glob(patterns, options, function (err, files) {
    if (err) return stream.emit('error', err);

    each(files, function (fp, next) {
      toObject(fp, options, fn, function (err, file) {
        if (err) return stream.emit('error', err);

        stream.write(file);
        next();
      });
    }, function (err) {
      if (err) return stream.emit('error', err);
      if (!isReading) {
        stream.end();
      }
    });
  });

  stream.pipe(pass);
  return stream;
}

/**
 * Create a `file` object from the given `filepath`, `options`,
 * transform `fn` and `callback`
 *
 * @param  {String} `filepath`
 * @param  {Object} `options`
 * @param  {Function} fn
 * @param  {Function} `callback`
 * @return {Object}
 */

function toObject(filepath, options, fn, callback) {
  var globPath = filepath;

  if (options.cwd && typeof options.cwd === 'string') {
    filepath = path.join(options.cwd, filepath);
  }

  var file = { path: filepath };
  file.cwd = options.cwd || '';
  file.options = options;
  file.options.globPath = globPath;

  if (typeof fn === 'function') {
    return fn(file, options, callback);
  }

  return callback(null, file);
}

/**
 * Cast the given value to an array.
 *
 * @param  {*} val
 * @return {Array}
 */

function arrayify(val) {
  return val = Array.isArray(val) ? val : [val];
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;

/**
 * Expose `streamLoader.contents`
 */

module.exports.contents = utils.contents;
