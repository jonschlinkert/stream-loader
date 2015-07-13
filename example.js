
var async = require('async');
var glob = require('glob');
var through = require('through2');
var utils = require('./lib/utils');


function readdir(options, fn) {
  var opts = {};

  return through.obj(function (pattern, enc, cb) {
    var stream = this;

    glob(pattern, opts, function (err, files) {
      if (err) return cb(err);

      addFiles(stream, files, opts, cb);
    });
  });
};

function addFiles(stream, files, opts, cb) {
  async.each(files, function (fp, next) {
    stream.push(utils.toFile(fp, opts));
    next();
  }, cb);
}

