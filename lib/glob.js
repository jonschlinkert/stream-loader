'use strict';

var utils = require('./utils');

module.exports = function (patterns, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (typeof cb !== 'function') {
    throw new Error('expected a callback function.');
  }

  if (!utils.isValidGlob(patterns)) {
    cb(new Error('invalid glob pattern: ' + patterns));
    return;
  }

  var Glob = utils.glob.Glob;
  var sifted = siftPatterns(patterns);
  var includes = sifted.includes;
  var excludes = sifted.excludes;

  function updateOptions(inclusive) {
    return setIgnores(options, excludes, inclusive.index);
  }

  utils.reduce(includes, [], function (acc, include, next) {
    var opts = updateOptions(include);

    new Glob(include.pattern, opts, function (err, files) {
      if (err) return next(err);
      next(null, acc.concat(files));
    })
  }, cb);
};

module.exports.sync = function (patterns, options) {
  if (!utils.isValidGlob(patterns)) {
    throw new Error('invalid glob pattern: ' + patterns);
  }

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
