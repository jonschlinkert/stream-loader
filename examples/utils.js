'use strict';

var File = require('vinyl');
var extend = require('extend-shallow');
var utils = module.exports;

utils.toVinyl = function() {
  return function(data, enc, cb) {
    if (File.isVinyl(data)) {
      return cb(null, data);
    }
    var file = new File(data);
    extend(file, data);
    return cb(null, data);
  };
};
