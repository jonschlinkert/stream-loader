'use strict';

var async = require('async');
var through = require('through2');
var extend = require('extend-shallow');
var utils = require('../../lib/utils');
var src = require('src-stream');

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

  stream = stream
    .pipe(fn(opts));

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
  return src(stream);
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;
