var path = require('path');
var fs = require('fs');
// var assert = require('assert');
var chai = require('chai');
// var expect = require('chai').expect;
var _ = require('lodash');

var assert = chai.assert;

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

describe('Formatter.HTML', function () {
	'use strict';

	var testFilePath = path.join(__dirname, 'fixture', 'test.jsp');

	// var obj = new File(testFilePath);
	var htmlLogger = new Logger.Logger();
	var htmlFormatter = new Formatter.HTML(testFilePath, htmlLogger);
	var source = fs.readFileSync(testFilePath, 'utf-8');
	var fileErrors = htmlLogger.fileErrors;

	htmlFormatter.format(source);

	var htmlErrors = fileErrors[testFilePath];
// console.log(htmlErrors);
	// it('has the correct number of errors', function () {
	// 	assert.equal(htmlLogger.testStats.failures, 2);
	// });

	var getErrorMsgByLine = function(lineNum, errors) {
		return _.result(_.findWhere(errors, {line: lineNum}), 'msg') || '';
	};

	it('sort-attr-values', function () {
		_.range(8,10).forEach(
			function(item, index) {
				var msg = getErrorMsgByLine(item, htmlErrors);

				assert.equal(msg.indexOf('Sort attribute values'), 0);
			}
		);
	});

	it('sort-attrs', function () {
		_.range(12,17).forEach(
			function(item, index) {
				var msg = getErrorMsgByLine(item, htmlErrors);

				assert.equal(msg.indexOf('Sort attributes'), 0);
			}
		);
	});

	it('invalid-whitespace', function () {
		var msg = getErrorMsgByLine(20, htmlErrors);

		assert.equal(msg.indexOf('Invalid whitespace characters'), 0);
	});

	it('mixed-spaces-tabs', function () {
		var msg = getErrorMsgByLine(22, htmlErrors);

		assert.equal(msg.indexOf('Mixed spaces and tabs'), 0);
	});

	it('.parseJs()', function () {
		var scriptBlocks = htmlFormatter.parseJs(source);

		assert.isArray(scriptBlocks);
		assert.equal(scriptBlocks.length, 3);
		scriptBlocks.forEach(assert.isString);
	});

	it('.extractJs()', function () {
		var scriptBlocks = htmlFormatter.extractJs(source);

		assert.isArray(scriptBlocks);
		assert.equal(scriptBlocks.length, 3);
		scriptBlocks.forEach(assert.isObject);
	});

	it('.formatJs()', function () {
		var msg = getErrorMsgByLine(34, htmlErrors);

		assert.equal(msg.indexOf('Missing semicolon'), 0);
	});
});