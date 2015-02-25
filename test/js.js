var path = require('path');
var fs = require('fs');
// var assert = require('assert');
var chai = require('chai');
chai.use(require('chai-string'));
// var expect = require('chai').expect;
var _ = require('lodash');

var assert = chai.assert;

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

var sub = require('../lib/base').sub;

describe('Formatter.JS', function () {
	'use strict';

	var testFilePath = path.join(__dirname, 'fixture', 'test.js');

	var jsLogger = new Logger.Logger();
	var jsFormatter = new Formatter.JS(testFilePath, jsLogger);
	var source = fs.readFileSync(testFilePath, 'utf-8');
	var fileErrors = jsLogger.fileErrors;

	jsFormatter.format(source, false);

	var jsErrors = jsLogger.getErrors(testFilePath);

	var getErrorMsgByLine = function(lineNum, errors) {
		return _.result(_.findWhere(errors, {line: lineNum}), 'msg') || '';
	};

	it(
		'should ignore values in comments',
		function () {
			assert.equal(getErrorMsgByLine(1, jsErrors), '');
		}
	);

	it(
		'should recognize an invalid conditional',
		function () {
			assert.startsWith(getErrorMsgByLine(5, jsErrors), 'Needs a space between ")" and "{":');
		}
	);

	it(
		'should recognize an invalid argument format',
		function () {
			assert.startsWith(getErrorMsgByLine(11, jsErrors), 'These arguments should each be on their own line:');
		}
	);

	it(
		'should recognize an invalid function format',
		function () {
			assert.startsWith(getErrorMsgByLine(16, jsErrors), 'Anonymous function expressions should be formatted as function(:');
		}
	);

	it(
		'should recognize variables passed to Liferay.Language.get',
		function () {
			assert.startsWith(getErrorMsgByLine(21, jsErrors), 'You should never pass variables to Liferay.Language.get():');
		}
	);

	it(
		'should recognize debugging statements',
		function () {
			assert.startsWith(getErrorMsgByLine(23, jsErrors), 'Debugging statement:');
		}
	);

	it(
		'should recognize variable line spacing',
		function () {
			assert.startsWith(getErrorMsgByLine(25, jsErrors), 'Variable declaration needs a new line after it:');
		}
	);

	it(
		'should print code as source',
		function () {
			var srcCode = 'var foo = 1';

			assert.equal(jsFormatter._printAsSource(srcCode), '1 ' + srcCode);
		}
	);

	it(
		'should parse JS syntax',
		function () {
			var jsLoggerParse = new Logger.Logger();
			var jsFormatterParse = new Formatter.JS(testFilePath, jsLoggerParse);
			var processed = false;

			jsFormatterParse.processor.VariableDeclaration = function(node, parent) {
				assert.isObject(node);
				assert.isObject(parent);

				assert.equal(node.type, 'VariableDeclaration');
				assert.isArray(node.declarations);
				assert.equal(node.declarations[0].id.name, 'x');

				processed = true;
			};

			jsFormatterParse._processSyntax('var x = 123;');

			assert.isTrue(processed, 'JS was not processed');

			jsFormatterParse._processSyntax('var x = ;');

			var parseErrors = jsLoggerParse.getErrors(testFilePath);

			assert.equal(parseErrors.length, 1);
			assert.equal(parseErrors[0].msg, 'Could not parse JavaScript: Unexpected token ;');

			var jsLoggerParseVerbose = new Logger.Logger();
			var jsFormatterParseVerbose = new Formatter.JS(testFilePath, jsLoggerParseVerbose);

			jsFormatterParseVerbose.flags.verbose = true;
			jsFormatterParseVerbose._processSyntax('var x = ;');

			var verboseDetails = jsLoggerParseVerbose.verboseDetails;

			assert.isString(verboseDetails);
			assert.isAbove(verboseDetails.length, 0);
		}
	);


});

describe('Formatter.JS Node', function () {
	'use strict';

	var testFilePath = path.join(__dirname, 'fixture', 'test_node.js');

	var jsLogger = new Logger.Logger();
	var jsFormatter = new Formatter.JS(testFilePath, jsLogger);
	var source = fs.readFileSync(testFilePath, 'utf-8');
	var fileErrors = jsLogger.fileErrors;

	jsFormatter.format(source, false);

	var jsErrors = jsLogger.getErrors(testFilePath);

	var getErrorMsgByLine = function(lineNum, errors) {
		return _.result(_.findWhere(errors, {line: lineNum}), 'msg') || '';
	};

	it(
		'should not recognize debugging statements',
		function () {
			assert.equal(getErrorMsgByLine(3, jsErrors), '');
		}
	);

});