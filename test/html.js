var _ = require('lodash');
var chai = require('chai');
var fs = require('fs');
var path = require('path');

var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');
var sub = require('string-sub');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Formatter.HTML',
	function() {
		'use strict';

		var testFilePath = path.join(__dirname, 'fixture', 'test.jsp');

		var htmlLogger = new Logger.constructor();
		var htmlFormatter = new Formatter.HTML(testFilePath, htmlLogger);
		var source = fs.readFileSync(testFilePath, 'utf-8');
		var fileErrors = htmlLogger.fileErrors;

		htmlFormatter.format(source);

		var htmlErrors = fileErrors[testFilePath];

		var getErrorMsgByLine = function(lineNum, errors) {
			var whereLine = {
				line: lineNum
			};

			return _.result(_.findWhere(errors, whereLine), 'msg') || '';
		};

		it(
			'should detect unsorted attribute values',
			function() {
				_.range(8, 10).forEach(
					function(item, index) {
						var msg = getErrorMsgByLine(item, htmlErrors);

						assert.startsWith(msg, 'Sort attribute values');
					}
				);

				assert.equal(getErrorMsgByLine(71, htmlErrors), '');
				assert.equal(getErrorMsgByLine(72, htmlErrors), '');
				assert.startsWith(getErrorMsgByLine(73, htmlErrors), 'Sort attribute values');
			}
		);

		it(
			'should detect unsorted attributes',
			function() {
				_.range(12, 17).forEach(
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
				var msg = getErrorMsgByLine(21, htmlErrors);

				assert.startsWith(msg, 'Invalid whitespace characters');
			}
		);

		it(
			'should detect spaces mixed with tabs',
			function() {
				var msg = getErrorMsgByLine(23, htmlErrors);

				assert.startsWith(msg, 'Mixed spaces and tabs');
			}
		);

		it(
			'should ignore attributes with JavaScript',
			function() {
				var msg = getErrorMsgByLine(59, htmlErrors);

				assert.equal(msg, '');
			}
		);

		it(
			'should parse script blocks correctly',
			function() {
				var scriptBlocks = htmlFormatter.parseJs(source);

				assert.isArray(scriptBlocks);
				assert.equal(scriptBlocks.length, 4);
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
				assert.equal(scriptBlocks.length, 4);
				scriptBlocks.forEach(assert.isObject);

				scriptBlocks = htmlFormatter.extractJs('<html></html>');

				assert.isArray(scriptBlocks);
				assert.equal(scriptBlocks.length, 0);
			}
		);

		it(
			'should format script blocks',
			function() {
				var msg = getErrorMsgByLine(35, htmlErrors);

				assert.startsWith(msg, 'Missing semicolon');
			}
		);

		it(
			'should parse style blocks correctly',
			function() {
				var styleBlocks = htmlFormatter.parseCSS(source);

				assert.isArray(styleBlocks);
				assert.equal(styleBlocks.length, 1);
				styleBlocks.forEach(assert.isString);
			}
		);

		it(
			'should not find non-existant style blocks',
			function() {
				var styleBlocks = htmlFormatter.parseCSS('<p>Foo</p>');

				assert.isArray(styleBlocks);
				assert.equal(styleBlocks.length, 0);
			}
		);

		it(
			'should extract style blocks correctly',
			function() {
				var styleBlocks = htmlFormatter.extractCSS(source);

				assert.isArray(styleBlocks);
				assert.equal(styleBlocks.length, 1);
				styleBlocks.forEach(assert.isObject);

				styleBlocks = htmlFormatter.extractCSS('<html></html>');

				assert.isArray(styleBlocks);
				assert.equal(styleBlocks.length, 0);
			}
		);

		it(
			'should format style blocks',
			function() {
				var msg = getErrorMsgByLine(64, htmlErrors);

				assert.startsWith(msg, 'You should use "border-width: 0;": border: none;');
			}
		);

		it(
			'should recognize calls to Liferay.Language.get inside of JSPs',
			function() {
				assert.startsWith(getErrorMsgByLine(37, htmlErrors), 'Do not use Liferay.Language.get() outside of .js files:');
			}
		);

		it(
			'should recognize calls to Liferay.provide inside of async script blocks',
			function() {
				assert.startsWith(getErrorMsgByLine(39, htmlErrors), 'You can\'t have a Liferay.provide call in a script taglib that has a "use" attribute');
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
				var p2 = token + '2' + token;

				var before = '<p class="<%= "Some value" %> foo <%= "Another value" %> ${tab}">Foo</p>';
				var after = '<p class="' + p0 + ' foo ' + p1 + ' ' + p2 + '">Foo</p>';

				var str = privHTMLFormatter._attrRemoveScriptlets(before, 1);

				assert.isString(str);
				assert.equal(str, after);
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
				assert.equal(str, after);
			}
		);

		it(
			'should restore scriptlets to attribute values',
			function() {
				var token = privHTMLFormatter._TOKEN;
				var p0 = token + '0' + token;
				var p1 = token + '1' + token;
				var p2 = token + '2' + token;

				var before = '<p class="' + p0 + ' foo ' + p1 + ' ' + p2 + '">Foo</p>';
				var after = '<p class="<%= "Some value" %> foo <%= "Another value" %> ${tab}">Foo</p>';

				var str = privHTMLFormatter._attrRestoreScriptlets(before, 1);

				assert.isString(str);
				assert.equal(str, after);
			}
		);

		it(
			'should clean attr tokens',
			function() {
				var token = privHTMLFormatter._TOKEN;
				var nsToken = privHTMLFormatter._NS_TOKEN;

				var p0 = token + '0' + token;
				var p1 = nsToken + '1' + nsToken;

				var before = '<p class="' + p0 + ' foo ' + p1 + '">Foo</p>';
				var after = '<p class="<%...%> foo <po.../>">Foo</p>';

				var str = privHTMLFormatter._attrCleanTokens(before);

				assert.isString(str);
				assert.equal(str, after);
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
				assert.equal(str, after);
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

		it(
			'should handle scriptlet whitespace in script blocks',
			function() {
				var scriptBlock = privHTMLFormatter.extractJs('<script>\n\n<% if () { %>\n\nvar testVar = "foo";\n\n<%= obj.getJavaScript() %>\n\n<% } %>\n\n</script>')[0];

				var contents = privHTMLFormatter._jsHandleScriptletWhitespace(scriptBlock).contents;

				assert.equal(contents, '\n\n//_SCRIPTLET_\n\nvar testVar = "foo";\n\n//_SCRIPTLET_\n\n//_SCRIPTLET_\n\n');

				scriptBlock = privHTMLFormatter.extractJs('<script><% foo() %></script>')[0];

				contents = privHTMLFormatter._jsHandleScriptletWhitespace(scriptBlock).contents;

				assert.equal(contents, '//_SCRIPTLET_');

				scriptBlock = privHTMLFormatter.extractJs('<script>\n\n<%foo();\nbar();%>\n\n</script>')[0];

				scriptBlock = privHTMLFormatter._jsRemoveScriptletBlocks(scriptBlock);

				contents = privHTMLFormatter._jsHandleScriptletWhitespace(scriptBlock).contents;

				assert.equal(contents, '\nvoid 0;\n/* scriptlet block \nvoid 0; */\nvoid 0;\n');
			}
		);
	}
);

describe(
	'Formatter.HTML Excludes',
	function() {
		'use strict';

		var getErrorMsgByLine = function(lineNum, errors) {
			var whereLine = {
				line: lineNum
			};

			return _.result(_.findWhere(errors, whereLine), 'msg') || '';
		};

		it(
			'should ignore excluded files',
			function() {
				_.forEach(
					['nocsf'],
					function(item, index) {
						['-', '_', '.'].forEach(
							function(n, i) {
								var testFilePath = 'test' + n + item + '.html';
								var logger = new Logger.constructor();
								var formatter = new Formatter.get(testFilePath, logger);

								var errors = logger.getErrors(testFilePath);

								assert.startsWith(getErrorMsgByLine('n/a', errors), 'This file was ignored.');
							}
						);
					}
				);
			}
		);
	}
);