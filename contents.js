'use strict';

var through = require('through2');
var fs = require('graceful-fs');

module.exports = function contents(options) {
  options = options || {};

  return through.obj(function (file, enc, cb) {
    if (file.isDirectory()) {
      return cb(null, file);
    }

    if (options.buffer !== false) {
      return fs.readFile(file.path, function (err, data) {
        if (err) return cb(err);

        file.contents = data;
        return cb(null, file);
      });
    }

    try {
      file.contents = fs.createReadStream(file.path);
      return cb(null, file);
    } catch (err) {
      return cb(err);
    }
  });
};
