'use strict';

var rimraf = require('rimraf');

rimraf('actual', function (err) {
  if (err) console.error(err);
});
