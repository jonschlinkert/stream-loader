'use strict';

require('mocha');
var assert = require('assert');
var File = require('vinyl');
var utils = require('../lib/utils');
var loader = require('..');

describe('utils', function () {
  describe('toFile', function () {
    it('should create a vinyl file', function() {
      var file = utils.toFile('abc', 'abc', {});
      assert(file);
      assert(File.isVinyl(file));
    });

    it('should work when no options object is passed', function() {
      var file = utils.toFile('abc', 'abc');
      assert(file);
      assert(File.isVinyl(file));
    });

    it('should add a cwd property', function() {
      var file = utils.toFile('abc', 'abc');
      assert(file);
      assert(file.cwd);
    });

    it('should use the cwd on the options', function() {
      var file = utils.toFile('abc', 'abc', {cwd: 'xyz'});
      assert(file);
      assert(file.cwd);
      assert(file.cwd === 'xyz');
    });

    it('should use process.cwd if no cwd is passed', function() {
      var file = utils.toFile('abc', 'abc');
      assert(file);
      assert(file.cwd);
      assert(file.cwd === process.cwd());
    });

    it('should add a base property', function() {
      var file = utils.toFile('abc', 'abc');
      assert(file);
      assert(file.base);
    });

    it('should use base passed on options', function() {
      var file = utils.toFile('abc', 'abc', {base: 'xyz'});
      assert(file);
      assert(file.base);
      assert(file.base === 'xyz');
    });

    it('should use glob parent if no base is passed', function() {
      var file = utils.toFile('abc', 'a/b/c/*.js');
      assert(file);
      assert(file.base);
      assert(file.base === 'a/b/c');
    });

    it('should use the glob parent of the first pattern in an array', function() {
      var file = utils.toFile('abc', ['x/y/z/*.md', 'a/b/c/*.js']);
      assert(file);
      assert(file.base);
      assert(file.base === 'x/y/z');
    });

    it('should use the glob parent of the first pattern in an array', function(done) {
      try {
        utils.toFile('abc', new Date());
        done(new Error('expected an error.'));
      } catch(err) {
        assert(err);
        assert(err.message);
        assert(err.message === 'expected pattern to be a string or array');
        done();
      }
    });
  });
});
