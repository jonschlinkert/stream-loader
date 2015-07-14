'use strict';

var fs = require('graceful-fs');
var path = require('path');
var async = require('async');
var globby = require('globby');
var ms = require('merge-stream');
var parent = require('glob-parent');
var duplexify = require('duplexify');
var extend = require('extend-shallow');
// var symlinks = require('file-symlinks');
// var contents = require('file-contents');
// var stats = require('file-stats');
var isValidGlob = require('is-valid-glob');
var through = require('through2');
var File = require('vinyl');
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

  // passthrough stream used when stream is piped to
  var pass = through.obj();
  pass.setMaxListeners(0);

  // if a loader callback is passed, bind the stream
  // and remove maxListeners
  if (typeof fn === 'function') {
    fn = fn.bind(stream);
  }

  // if no patterns were actually passed, allow the next
  // plugin to keep processing
  if (!patterns.length) {
    stream = stream.pipe(pass);
    return stream;
  }

  if (!isValidGlob(patterns)) {
    throw new Error('stream-loader: invalid glob pattern: ' + patterns);
  }

  // make our pipeline of plugins
  stream = stream
    // .pipe(utils.toVinyl())
    // .pipe(utils.toFile(patterns, opts))
    // .pipe(utils.toFileObject(patterns, opts))
    // .pipe(symlinks(opts))
    // .pipe(stats(opts))
    // .pipe(contents(opts))
    .pipe(fn(opts))
    // .on('data', console.log);

  // create an output stream that will handle passthough streams
  var outputstream = duplexify.obj(pass, ms(stream, pass));
  outputstream.setMaxListeners(0);

  // handle when the outputstream is being piped
  // to (this ensures that we don't close)
  // the stream too soon
  var isReading = false;
  outputstream.on('pipe', function (src) {
    isReading = true;
    src.on('end', function () {
      isReading = false;
      outputstream.end();
    });
  });

  // when our stream ends, end the outputstream
  stream.on('end', function () {
    if (!isReading) {
      outputstream.end();
    }
  });

  // find the files and write them to the stream
  globby(patterns, function (err, files) {
    if (err) return stream.emit('error', err);
    var len = files.length, i = 0;
    while (len--) {
      stream.write(utils.toFile(files[i++], patterns, opts));
    }
    stream.end();
  });

  return outputstream;
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;

/**
 * Expose `streamLoader.contents`
 */

module.exports.contents = utils.contents;


module.exports.loader = function vinyl(options, fn) {
  var opts = {loader: options || {}};
  fn = fn || utils.property;

  return through.obj(function (pattern, enc, cb) {
    var stream = this;

    glob(pattern, opts, function (err, files) {
      if (err) return cb(err);

      async.each(files, function (fp, next) {
        stream.push(toFile(fp, opts, fn));
        next();
      }, cb);
    });
  });
};

