var path = require('path');
var fs = require('fs');
var chai = require('chai');
var Promise = require('bluebird');
var _ = require('lodash');
chai.use(require('chai-string'));

var assert = chai.assert;

var re = require('../lib/re');

var sub = require('../lib/base').sub;

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

describe('File', function () {
	'use strict';

	var testFilePath = path.join(__dirname, 'fixture', 'file.txt');

	var noopFormatter = Formatter.create(
		{
			id: 'noop',
			extensions: '*.txt',
			format: function(contents, path) {
				return contents;
			}
		}
	);

	var upperFormatter = Formatter.create(
		{
			id: 'upper',
			extensions: '*.txt',
			format: function(contents, path) {
				return contents.toUpperCase();
			}
		}
	);

	it(
		'should set the file path',
		function() {
			var testFile = new File(testFilePath);

			assert.equal(testFile.path, testFilePath);
		}
	);

	it(
		'should set return a promise from .read',
		function() {
			var testFile = new File(testFilePath);

			var promise = testFile.read();

			assert.isTrue(promise instanceof Promise);
		}
	);

	it(
		'should set return a promise from .format',
		function() {
			var testFile = new File(testFilePath);

			assert.isTrue(testFile.format(noopFormatter) instanceof Promise);
		}
	);

	it(
		'should be able to read the contents',
		function(done) {
			var testFile = new File(testFilePath);

			testFile.read().then(
				function(contents) {
					assert.isString(contents);
					assert.isAbove(contents.length, 0);
					assert.startsWith(contents, 'Lorem ipsum');
				}
			).then(
				function() {
					done();
				},
				done
			);
		}
	);

	it(
		'should be dirty when modified by a formatter',
		function(done) {
			var testFile = new File(testFilePath);

			var notDirty = testFile.format(noopFormatter).then(
				function(contents) {
					assert.isFalse(testFile.isDirty());
				}
			);

			var dirty = testFile.format(upperFormatter).then(
				function(contents) {
					assert.isTrue(testFile.isDirty());
				}
			);

			Promise.all([notDirty, dirty]).then(
				function() {
					done();
				},
				done
			);
		}
	);

	it(
		'should handle unreadable files',
		function(done) {
			var testMissingFilePath = path.join(__dirname, 'fixture', 'missing_file.txt');
			var testFile = new File(testMissingFilePath);

			var missingFile = testFile.read().then(
				function(contents) {
					assert.property(contents, 'errno', 'File exists, but it should not');
				},
				function(err) {
					assert.startsWith(testFile.handleFileReadError(err), 'File does not exist');
				}
			);

			var testUnreadableFilePath = path.join(__dirname, 'fixture');
			var testUnreadableFile = new File(testUnreadableFilePath);

			var unreadableFile = testUnreadableFile.read().then(
				function(contents) {
					assert.property(contents, 'errno', 'File exists, but it should not');
				},
				function(err) {
					assert.startsWith(testFile.handleFileReadError(err), 'Could not open file');
				}
			);

			Promise.all([missingFile, unreadableFile]).then(
				function() {
					done();
				},
				done
			);
		}
	);
});