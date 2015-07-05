'use strict';

var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Convert files to vinyl files
 */

var src = loader(utils.toVinyl);

src('*.json')
  .pipe(src('*.txt', {cwd: 'fixtures'}))
  .pipe(src('*.md', {cwd: 'fixtures'}))
  .pipe(utils.contents())
  .pipe(dest('actual/'));
