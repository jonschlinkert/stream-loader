'use strict';

var dest = require('dest');
var utils = require('../lib/utils');
var loader = require('..');

var App = require('template');
var app = new App();

var src = loader(utils.toVinyl);

src('*.json')
  .pipe(src('*.js'))
  .pipe(src('fixtures/*.txt'))
  .pipe(src('fixtures/*.md'))
  .pipe(utils.contents())
  .pipe(utils.debug())
  .pipe(dest('actual/'));
