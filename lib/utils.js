'use strict';

var path = require('path');
var utils = require('lazy-cache')(require);

/**
 * Temporarily re-assign `require` so we can fool browserify
 * into recognizing lazy deps.
 */

var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 * (in the following section `require` is actually lazy-cache)
 */

require('glob');
require('vinyl', 'File');
require('glob-parent', 'parent');
require('extend-shallow', 'extend');
require('src-stream', 'src');
require('is-valid-glob', 'isValidGlob');
require('async-array-reduce', 'reduce');
require('through2', 'through');

/**
 * Restore `require`
 */

require = fn;

/**
 * Base plugin function
 */

utils.base = function(stream, options, fn) {
  return stream
    .pipe(utils.through.obj(function (file, enc, cb) {
      if (typeof fn === 'function') {
        file = fn.call(this, file, options);
      }
      this.push(file);
      return cb();
    }));
};

/**
 * Convert a data object to a basic file object.
 *
 * @param  {Object} `options`
 * @return {Object}
 */

utils.toFile = function(fp, pattern, options) {
  options = options || {};

  var file = { contents: null };
  file.cwd = options.cwd || process.cwd();
  file.path = path.resolve(file.cwd, fp);
  file.base = options.base;

  if (!file.base) {
    if (Array.isArray(pattern)) {
      pattern = pattern[0];
    }

    if (typeof pattern !== 'string') {
      throw new TypeError('expected pattern to be a string or array');
    }

    var base = utils.parent(pattern);
    if (base !== '.') {
      file.base = base;
    }
  }

  file = new utils.File(file);
  file.options = options;
  file.options.orig = fp;
  return file;
};

/**
 * Expose `utils`
 */

module.exports = utils;
