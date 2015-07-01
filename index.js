'use strict';

var fs = require('fs');
var path = require('path');
var each = require('async-each');
var glob = require('globby');
var extend = require('extend-shallow');
var through = require('through2');

module.exports = function streamLoader(opts, fn) {
  if (typeof opts === 'function') {
    fn = opts; opts = {};
  }

  return function (patterns, options) {
    patterns = Array.isArray(patterns) ? patterns : [patterns];
    options = extend({loader: opts || {}}, options);
    var stream = through.obj();
    var pass = through.obj();

    if (typeof fn === 'function') {
      stream.setMaxListeners(0);
      fn = fn.bind(stream);
    }

    if (!patterns.length) {
      process.nextTick(pass.end.bind(pass));
      stream.pipe(pass);
      return stream;
    }

    glob(patterns, options, function (err, files) {
      if (err) return stream.emit('error', err);

      each(files, function (fp, next) {
        toFile(fp, options, fn, function (err, file) {
          if (err) return stream.emit('error', err);

          stream.write(file);
          next();
        })
      }, function (err) {
        if (err) return stream.emit('error', err);
      });
    });

    stream.pipe(pass);
    return stream;
  };
};

function toFile(fp, opts, fn, cb) {
  if (opts.cwd && typeof opts.cwd === 'string') {
    fp = path.join(opts.cwd, fp);
  }

  var file = { path: fp };
  file.cwd = opts.cwd || '';
  file.contents = fs.readFileSync(fp);
  file.options = opts;

  if (typeof fn === 'function') {
    return fn(null, file, cb);
  }
  return cb(null, file);
}

function read(options) {
  return through.obj(function(file, enc, cb) {
    if (file.isDirectory()) {
      return cb(null, file);
    }
    if (options.buffer !== false) {
      return fs.readFile(file.path, function (err, contents) {
        if (err) return cb(err);
        file.contents = contents;
        return cb(null, file);
      });
    }
    file.contents = fs.createReadStream(file.path);
    return cb(null, file);
  });
}
