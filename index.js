'use strict';

var fs = require('graceful-fs');
var path = require('path');
var async = require('async');
var extend = require('extend-shallow');
var globby = require('globby');
var parent = require('glob-parent');
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

  var isReading = false;

  // create the stream
  var stream = through.obj();
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
    stream = stream.pipe(pass);
    stream.on('pipe', function (src) {
      isReading = true;
      src.on('end', function () {
        isReading = false;
        stream.end();
      });
    });
    return stream;
  }

  if (!isValidGlob(patterns)) {
    throw new Error('stream-loader: invalid glob pattern: ' + patterns);
  }

  process.nextTick(function () {
    globby(patterns, function (err, files) {
      if (err) return stream.emit('error', err);
      var len = files.length;

      process.nextTick(function () {
        async.each(files, function (fp, next) {
          stream.once('write', next);
          stream.write(utils.toFile(fp, patterns, opts));
          // next();
        }, function (err) {
          process.nextTick(function () {
            if (!isReading) {
              stream.end();
            }
          });
        })

        // files.forEach(function (fp, i) {
        //   stream.write(utils.toFile(fp, patterns, opts));
        //   // stream.emit('data', {
        //   //   options: options,
        //   //   path: fp,
        //   //   orig: fp
        //   // });
        // });

      });

      process.nextTick(function () {
        if (!isReading) {
          stream.end();
        }
      });
    });
  });

  var result = stream
    // .pipe(utils.toVinyl())
    // .pipe(utils.toFile(patterns, opts))
    // .pipe(utils.toFileObject(patterns, opts))
    // .pipe(symlinks(opts))
    // .pipe(stats(opts))
    // .pipe(contents(opts))
    .pipe(fn(opts))
    // .on('data', console.log);

  result = result.pipe(pass);
  result.on('pipe', function (src) {
    isReading = true;
    src.on('end', function () {
      isReading = false;
      result.resume();
      result.end();
    });
  });
  return result;
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

