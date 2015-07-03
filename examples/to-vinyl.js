'use strict';

var File = require('vinyl');

module.exports = function toVinyl(file, options, cb) {
  this.on('error', function (err) {
    return cb(err);
  });
  return cb(null, new File(file));
};
