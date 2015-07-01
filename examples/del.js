'use strict';

var del = require('del');

del('actual/**', function (err) {
  if (err) console.error(err);
});
