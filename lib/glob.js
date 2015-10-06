'use strict';

var utils = require('./utils');

module.exports = function (patterns, config, cb) {
  if (typeof config === 'function') {
    cb = config;
    config = {};
  }

  if (typeof cb !== 'function') {
    throw new Error('expected a callback function.');
  }

  if (!utils.isValidGlob(patterns)) {
    cb(new Error('invalid glob pattern: ' + patterns));
    return;
  }

  // shallow clone options
  var options = utils.extend({}, config);
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
    })
  }, cb);
};

module.exports.sync = function (patterns, config) {
  if (!utils.isValidGlob(patterns)) {
    throw new Error('invalid glob pattern: ' + patterns);
  }

  // shallow clone options
  var options = utils.extend({}, config);
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
  patterns = utils.arrayify(patterns);

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
  opts.ignore = utils.arrayify(opts.ignore || []);
  opts.ignore.push.apply(opts.ignore, negations);
  return opts;
}

