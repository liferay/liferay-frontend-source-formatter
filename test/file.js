var chai = require('chai');
var path = require('path');

var sub = require('string-sub');
var File = require('../lib/file');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'File',
	function() {
		'use strict';

		var filePath = path.resolve('foo.txt');

		it(
			'should set handle a file read error',
			function() {
				var missingFileErr = {
					code: 'ENOENT'
				};

				var permissionsFileErr = {
					code: 'EACCESS'
				};

				assert.equal(File.handleFileReadError(missingFileErr, filePath), sub('File does not exist: {0}', filePath));
				assert.equal(File.handleFileReadError(permissionsFileErr, filePath), sub('Could not open file: {0}', filePath));
			}
		);

		it(
			'should set handle a file write error',
			function() {
				var permissionsFileErr = {
					code: 'EACCESS'
				};

				assert.equal(File.handleFileWriteError(permissionsFileErr, filePath), sub('Could not write to file: {0}', filePath));
				assert.equal(File.handleFileWriteError(permissionsFileErr, '<input>'), 'Can\'t write to <input> (no file name provided): <input>');
			}
		);
	}
);