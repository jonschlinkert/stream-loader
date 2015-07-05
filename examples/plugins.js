'use strict';

require('jshint-stylish');
var jshint = require('gulp-jshint');
var utils = require('../lib/utils');
var loader = require('..');

/**
 * Convert files to vinyl files
 */

var src = loader(utils.toVinyl);

src('examples/*.js')
  .pipe(src('*.js'))
  .pipe(utils.contents())
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(utils.debug());
