'use strict';

var through = require('through2');
var fs = require('graceful-fs');

module.exports = function stats() {
  return through.obj(function (file, enc, cb) {
    fs.lstat(file.path, function (err, stats) {
      if (err) return cb(err);

      file.stat = stats;
    });
  });
};
