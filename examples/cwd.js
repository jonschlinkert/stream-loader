'use strict';

var dest = require('dest');
var contents = require('./contents');
var toVinyl = require('./to-vinyl');
var loader = require('..');

/**
 * Convert files to vinyl files
 */
var src = loader(toVinyl);


/**
 * Example usage
 */
src('*.json')
  .pipe(src('*.txt', {cwd: 'fixtures'}))
  .pipe(src('*.md', {cwd: 'fixtures'}))
  .pipe(contents())
  .pipe(dest('actual/'));
