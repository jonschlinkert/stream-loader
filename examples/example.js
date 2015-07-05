'use strict';

var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Example usage
 */

var src = loader(utils.toVinyl);

src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(utils.contents())
  .pipe(dest('actual/'))
