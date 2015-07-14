
var async = require('async');
var through = require('through2');
var loader = require('./');

var src = loader(function (opts) {
  return through.obj(function (count, enc, cb) {
    console.log('[' + opts.name + '] count', count);
    this.push(count);
    cb();
  });
});

src('AAA', { name: 'AAA', max: 5 })
  .pipe(src('BBB', { name: 'BBB', max: 5, interval: 1500 }))
  .pipe(src(''))
  .on('data', console.log)
  .on('error', console.error)
  .on('end', console.log.bind(console, 'done'));
