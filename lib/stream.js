'use strict';

var path = require('path');
var utils = require('./utils');
var Glob = require('glob').Glob;
var merge = require('merge-stream');
var MapCache = require('map-cache');

module.exports = function (patterns, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var sifted = siftPatterns(patterns);
  var includes = sifted.includes;
  var excludes = sifted.excludes;

  function updateOptions(inclusive) {
    return setIgnores(options, excludes, inclusive.index);
  }

  utils.reduce(includes, [], function (acc, include, next) {
    var opts = updateOptions(include);

    utils.glob(include.pattern, opts, function (err, files) {
      if (err) return next(err);
      next(null, acc.concat(files));
    });
  }, cb);
};

module.exports.stream = function (patterns, config, cb) {
  console.log(patterns)
  var sifted = siftPatterns(patterns);
  var includes = sifted.includes;
  var excludes = sifted.excludes;
  var matches = [];

  function updateOptions(inclusive) {
    return setIgnores(config, excludes, inclusive.index);
  }

  var options = utils.extend({cwd: process.cwd()}, config);
  // var stream = utils.through.obj();
  var streams = [];
  var glob;

  var len = includes.length, i = -1;

  // console.log(includes)
  includes.forEach(function (include) {
    var opts = updateOptions(include);
    var pattern = include.pattern;
    var parent = utils.parent(pattern);
    var stream = utils.through.obj();
    streams.push(stream);

    var n = 0;

    glob = new Glob(pattern, opts);
    glob.on('match', function(fp) {
      console.log('match', fp);
      stream.write(utils.toFile(fp, pattern, opts));
      n++;
    });

    glob.on('error', function(err) {
      stream.emit('error', err);
    });

    glob.on('end', function () {
      console.log(n + ' files found for "' + pattern + '"');
      stream.end();
    });
  });

  // console.log(streams)
  return merge(streams);

  // includes.forEach(function (include) {
  //   var opts = updateOptions(include);
  //   var parent = utils.parent(include.pattern);
  //   var filesStream = utils.through.obj();

  //   glob = new Glob(include.pattern, opts);

  //   glob.on('error', filesStream.emit.bind(filesStream, 'error'));
  //   glob.on('end', function() {
  //     filesStream.end();
  //   });

  //   glob.on('match', function(fp) {
  //     if (cache.has(fp)) return;

  //     cache.set(fp, true);
  //     filesStream.write({
  //       cwd: options.cwd,
  //       base: parent,
  //       path: path.resolve(options.cwd, fp)
  //     });
  //   });

  //   matches.push(filesStream);
  // });

  // return utils.combine(matches);
};

module.exports.sync = function (patterns, options) {
  var sifted = siftPatterns(patterns);
  var includes = sifted.includes;
  var excludes = sifted.excludes;

  var len = includes.length, i = -1;
  var res = [];

  while (++i < len) {
    var include = includes[i];
    var opts = setIgnores(options, excludes, include.index);
    res.push.apply(res, utils.glob.sync(include.pattern, opts));
  }
  return res;
};


function siftPatterns(patterns) {
  patterns = arrayify(patterns);

  var res = { includes: [], excludes: [] };
  var len = patterns.length, i = -1;

  while (++i < len) {
    var pattern = patterns[i];
    var stats = {index: i, pattern: pattern};

    if (pattern.charAt(0) === '!') {
      stats.pattern = pattern.slice(1);
      res.excludes.push(stats);
    } else {
      res.includes.push(stats);
    }
  }
  return res;
}

function setIgnores(opts, excludes, inclusiveIndex) {
  opts = utils.extend({}, opts);
  var negations = [];

  var len = excludes.length, i = -1;
  while (++i < len) {
    var exclusion = excludes[i];
    if (exclusion.index > inclusiveIndex) {
      negations.push(exclusion.pattern);
    }
  }
  opts.ignore = arrayify(opts.ignore || []);
  opts.ignore.push.apply(opts.ignore, negations);
  return opts;
}

function arrayify(arr) {
  return Array.isArray(arr) ? arr : [arr];
}
