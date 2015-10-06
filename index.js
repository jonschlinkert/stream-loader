'use strict';

var utils = require('./lib/utils');
var glob = require('./lib/stream');
// var glob = require('./lib/glob');

/**
 * Stream loader that returns a function for creating a stream
 * from a glob of files.
 *
 * @param  {Object} config Options.
 * @param  {Function} `fn` Loader callback
 * @return {Function} Function for loading a glob of files.
 */

function streamLoader(config, pipeline) {
  if (typeof config === 'function') {
    pipeline = config; config = {};
  }

  pipeline = pipeline || utils.base;

  return function (patterns, options) {
    var opts = utils.extend({ loader: config }, options);
    return createStream(patterns, opts, pipeline);
  };
}

/**
 * Create a src stream from the given glob `patterns`,
 * `options` and optional transform `pipeline`.
 *
 * @param  {String|Array} `patterns` Glob patterns
 * @param  {Object} `options` Options to pass to [globby]
 * @param  {Function} `pipeline` The loader callback, can be thought of as a transform function.
 * @return {Stream}
 */

function createStream(patterns, options, pipeline) {
  var opts = utils.extend({}, options.loader, options);
  opts.cwd = opts.cwd || process.cwd();

  // create the stream
  var stream = utils.through.obj();
  pipeline = pipeline.bind(stream);
  stream.setMaxListeners(0);

  // if no patterns were actually passed, allow the next
  // plugin to keep processing
  if (!patterns.length) {
    process.nextTick(stream.end.bind(stream));
    return utils.src(stream);
  }

  stream = utils.src(pipeline(stream, opts));
  var globs = glob.stream(patterns, opts);
  var outputstream = utils.src(utils.combine([globs, stream]));

  globs.on('end', function () {
    console.log('glob ended');
    setImmediate(outputstream.end.bind(outputstream));
  });

  // glob(patterns, opts, function (err, files) {
  //   if (err) return stream.emit('error', err);
  //   var len = files.length, i = -1;
  //   while (++i < len) {
  //     stream.write(utils.toFile(files[i], patterns, opts));
  //   }
  //   stream.end();
  // });

  return outputstream;
}

/**
 * Expose `streamLoader`
 */

module.exports = streamLoader;
