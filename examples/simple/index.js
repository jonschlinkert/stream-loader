'use strict';

var async = require('async');
var ms = require('merge-stream');
var through = require('through2');
var duplexify = require('duplexify');
var extend = require('extend-shallow');
var utils = require('../../lib/utils');

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

function createStream(patterns, options, fn) {
  var opts = extend({}, options.loader, options);

  // create the stream
  var stream = through.obj();
  stream.setMaxListeners(0);

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

  stream = stream
    .pipe(fn(opts));

  var outputstream = duplexify.obj(pass, ms(stream, pass));
  outputstream.setMaxListeners(0);

  var isReading = false;
  outputstream.on('pipe', function (src) {
    isReading = true;
    src.on('end', function () {
      isReading = false;
      outputstream.end();
    });
  });

  stream.on('end', function () {
    if (!isReading) {
      outputstream.end();
    }
  });

  var count = 0;
  var max = opts.max || 10;
  var interval = opts.interval || 500;
  var name = opts.name || 'default';
  var write = function () {
    stream.write('{' + name + '} ' + count++);
    if (count < max) {
      setTimeout(write, interval);
    } else {
      stream.end();
    }
  }
  process.nextTick(write);
  return outputstream;
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;
