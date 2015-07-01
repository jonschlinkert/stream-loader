'use strict';

var dest = require('dest');
var debug = require('./debug');
var contents = require('./contents');
var toVinyl = require('./to-vinyl');
var loader = require('..');

/**
 * Example usage
 */

var src = loader(toVinyl);


src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(contents())
  .pipe(debug())
  .pipe(dest('actual/'));
