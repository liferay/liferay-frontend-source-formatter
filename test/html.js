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

	it(
		'should detect unsorted attribute values',
		function () {
			_.range(8,10).forEach(
				function(item, index) {
					var msg = getErrorMsgByLine(item, htmlErrors);

					assert.startsWith(msg, 'Sort attribute values');
				}
			);
		}
	);

	it(
		'should detect unsorted attributes',
		function() {
			_.range(12,17).forEach(
				function(item, index) {
					var msg = getErrorMsgByLine(item, htmlErrors);

					assert.startsWith(msg, 'Sort attributes');
				}
			);
		}
	);

	it(
		'should detect invalid whitespace characters',
		function() {
			var msg = getErrorMsgByLine(20, htmlErrors);

			assert.startsWith(msg, 'Invalid whitespace characters');
		}
	);

	it(
		'should detect spaces mixed with tabs',
		function() {
			var msg = getErrorMsgByLine(22, htmlErrors);

			assert.startsWith(msg, 'Mixed spaces and tabs');
		}
	);

	it(
		'should parse script blocks correctly',
		function() {
			var scriptBlocks = htmlFormatter.parseJs(source);

			assert.isArray(scriptBlocks);
			assert.equal(scriptBlocks.length, 3);
			scriptBlocks.forEach(assert.isString);
		}
	);

	it(
		'should not find non-existant script blocks',
		function() {
			var scriptBlocks = htmlFormatter.parseJs('<p>Foo</p>');

			assert.isArray(scriptBlocks);
			assert.equal(scriptBlocks.length, 0);
		}
	);

	it(
		'should extract script blocks correctly',
		function() {
			var scriptBlocks = htmlFormatter.extractJs(source);

			assert.isArray(scriptBlocks);
			assert.equal(scriptBlocks.length, 3);
			scriptBlocks.forEach(assert.isObject);
		}
	);

	it(
		'should format script blocks',
		function() {
			var msg = getErrorMsgByLine(34, htmlErrors);

			assert.startsWith(msg, 'Missing semicolon');
		}
	);

	// Private methods

	var privHTMLFormatter = new Formatter.HTML(testFilePath, htmlLogger);

	it(
		'should remove scriptlets from attribute values',
		function() {
			var token = privHTMLFormatter._TOKEN;
			var p0 = token + '0' + token;
			var p1 = token + '1' + token;

			var before = '<p class="<%= "Some value" %> foo <%= "Another value" %>">Foo</p>';
			var after = '<p class="' + p0 + ' foo ' + p1 + '">Foo</p>';

			var str = privHTMLFormatter._attrRemoveScriptlets(before, 1);

			assert.isString(str);
			assert.equal(str,  after);
		}
	);

	it(
		'should remove portlet:namespace tags from attribute values',
		function() {
			var nsToken = privHTMLFormatter._NS_TOKEN;
			var p0 = nsToken + '0' + nsToken;

			var before = '<p id="<portlet:namespace />foo">Foo</p>';
			var after = '<p id="' + p0 + 'foo">Foo</p>';

			var str = privHTMLFormatter._attrRemoveTags(before, 1);

			assert.isString(str);
			assert.equal(str,  after);
		}
	);

	it(
		'should restore scriptlets to attribute values',
		function() {
			var token = privHTMLFormatter._TOKEN;
			var p0 = token + '0' + token;
			var p1 = token + '1' + token;

			var before = '<p class="' + p0 + ' foo ' + p1 + '">Foo</p>';
			var after = '<p class="<%= "Some value" %> foo <%= "Another value" %>">Foo</p>';

			var str = privHTMLFormatter._attrRestoreScriptlets(before, 1);

			assert.isString(str);
			assert.equal(str,  after);
		}
	);

	it(
		'should restore portlet:namespace tags to attribute values',
		function() {
			var nsToken = privHTMLFormatter._NS_TOKEN;
			var p0 = nsToken + '0' + nsToken;

			var before = '<p id="' + p0 + 'foo">Foo</p>';
			var after = '<p id="<portlet:namespace />foo">Foo</p>';

			var str = privHTMLFormatter._attrRestoreTags(before, 1);

			assert.isString(str);
			assert.equal(str,  after);
		}
	);

	it(
		'should get a map entry for a line',
		function() {
			// We'll get an entry for a line we can be sure we haven't tested on
			var newMapEntry = privHTMLFormatter._attrGetMapEntry(100);

			assert.isObject(newMapEntry);
		}
	);

	it(
		'should check attribute order',
		function() {
			var needsSortArr = ['<p id="foo" class="bar" />'];
			var doesNotNeedSortArr = ['<p id="foo" class="bar" />', '<p id="foo"><span class="bar"></span></p>'];

			_.forEach(
				needsSortArr,
				function(item, index) {
					var needsSort = privHTMLFormatter._attrCheckOrder('class', 'id', item);

					assert.isTrue(needsSort, item + ' needs attribute sorting');
				}
			);

			_.forEach(
				doesNotNeedSortArr,
				function(item, index) {
					var doesNotNeedSort = privHTMLFormatter._attrCheckOrder('id', 'class', item);

					assert.isFalse(doesNotNeedSort, item + ' does not need attribute sorting');
				}
			);
		}
	);

	it(
		'should sort attribute values',
		function() {
			var needsSortObj = {
				// attrName: [attrValue, expectedAttrValue]
				'class': ['foo bar', 'bar foo'],
				style: ['color: #F00; border: 1px solid;', 'border: 1px solid; color: #F00;']
			};

			var doesNotNeedSortArr = ['<p onClick="fn(val1, val2);" />', '<aui:input label="foo bar" />'];

			_.forEach(
				needsSortObj,
				function(item, index) {
					var before = sub('<p {0}="{1}" />', index, item[0]);
					var after = sub('<p {0}="{1}" />', index, item[1]);

					var result = privHTMLFormatter._attrSortValues(index, item[0], before, before, 1);

					assert.equal(result, after);
				}
			);

			_.forEach(
				doesNotNeedSortArr,
				function(item, index) {
					var result = privHTMLFormatter._attrSortValues('id', 'class', item, item, 1);

					assert.equal(result, item);
				}
			);
		}
	);

	it(
		'should handle get a scriptlet block replacement',
		function() {
			var result = privHTMLFormatter._getScriptletBlockReplacement(1);

			assert.equal(result, '/* scriptlet block  */');

			result = privHTMLFormatter._getScriptletBlockReplacement(5);

			assert.equal(result, '/* scriptlet block \nvoid 0;\nvoid 0;\nvoid 0;\nvoid 0; */');
		}
	);

	// it(
	// 	'should handle scriptlet whitespace in script blocks',
	// 	function() {
	// 		var scriptBlock = privHTMLFormatter.extractJs('<script>\n\n<% if() { %>\n\nvar test = "foo";\n\n<%= obj.getJavaScript() %>\n\n<% } %>\n\n</script>')[0];

	// 		console.log(privHTMLFormatter._jsHandleScriptletWhitespace(scriptBlock));
	// 	}
	// );

});