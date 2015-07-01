var through = require('through2');
var fs = require('graceful-fs');

module.exports = function contents(options) {
  return through.obj(function (file, enc, cb) {
    fs.lstat(file.path, function (err, stats) {
      if (err) return cb(err);

      file.stat = stats;
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

      file.contents = fs.createReadStream(file.path);
      return cb(err, file);
    });
  });
};
