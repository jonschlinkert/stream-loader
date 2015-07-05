'use strict';

var fs = require('graceful-fs');
var async = require('async');
var extend = require('extend-shallow');
var glob = require('globby');
var symlinks = require('file-symlinks');
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
  var opts = extend({}, options.loader, options);
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
  if (!patterns || !patterns.length) {
    process.nextTick(pass.end.bind(pass));
    stream.pipe(pass);
    return stream;
  }

  if (!isValidGlob(patterns)) {
    throw new Error('stream-loader: invalid glob pattern: ' + patterns);
  }

  glob(patterns, opts, function (err, files) {
    if (err) return stream.emit('error', err);

    async.each(files, function (fp, next) {
      stream.on('write', function () {
        next();
      });
      stream.write({options: options, orig: fp});
    }, function (err) {
      if (err) return stream.emit('error', err);
      if (!isReading) {
        stream.end();
      }
    });
  });

  var result = stream
    .pipe(utils.toFile(opts))
    .pipe(utils.stats(opts))

  if (opts.read === true) {
    result = result.pipe(utils.contents(opts));
  }

  if (typeof fn === 'function') {
    result = result.pipe(fn(opts));
  }

  // result = result.pipe(through.obj(function (file, enc, cb) {
  //   var temp = this;
  //   if (typeof fn === 'function') {
  //     fn(file, options, function (err, data) {
  //       // console.log(data)
  //       temp.push(data);
  //       return cb();
  //     });
  //   } else {
  //     this.push(file);
  //     return cb();
  //   }
  // }));

  return result.pipe(pass);
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;

/**
 * Expose `streamLoader.contents`
 */

module.exports.contents = utils.contents;
