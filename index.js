'use strict';

var globby = require('globby');
var extend = require('extend-shallow');
var src = require('src-stream');
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

  fn = fn || utils.base;

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
  var opts = extend({}, options.loader, options);
  opts.cwd = opts.cwd || process.cwd();

  // create the stream
  var stream = through.obj();
  stream.setMaxListeners(0);

  // if a loader callback is passed, bind the stream
  // and remove maxListeners
  if (typeof fn === 'function') {
    fn = fn.bind(stream);
  }

  // if no patterns were actually passed, allow the next
  // plugin to keep processing
  if (!patterns.length) {
    process.nextTick(stream.end.bind(stream));
    return src(stream);
  }

  if (!isValidGlob(patterns)) {
    throw new Error('stream-loader: invalid glob pattern: ' + patterns);
  }

  // make our pipeline of plugins
  stream = fn(stream, opts);

  // find the files and write them to the stream
  globby(patterns, function (err, files) {
    if (err) return stream.emit('error', err);
    var len = files.length, i = 0;
    while (len--) {
      stream.write(utils.toFile(files[i++], patterns, opts));
    }
    stream.end();
  });

  return src(stream);
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;
