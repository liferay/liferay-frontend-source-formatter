var _ = require('lodash');
var chai = require('chai');

chai.use(require('chai-string'));

var RE = require('../../lib/re');

var re = new RE(require('../../lib/rules'));

var assert = chai.assert;

describe(
	'JS Rule Engine Tests',
	function() {
		'use strict';

		it(
			'should detect and replace improper else format',
			function() {
				var rule = re.rules.js.elseFormat;

				var input = '} else {';
				var output = '}\nelse {';
				var expectedResult = ['} else', undefined, 'else'];

				var context = {
					content: input
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.deepEqual(expectedResult, _.toArray(result));

				assert.equal(output, re.replaceItem(result, rule, context));
			}
		);

		it(
			'should detect invalid argument format',
			function() {
				var rule = re.rules.js.invalidArgumentFormat;

				var shouldMatch = ['fire("foo",', 'setTimeout(function(', 'alert({'];

				shouldMatch.forEach(
					function(content, index) {
						var context = {
							content: content
						};

						var result = re.testContent(rule, context);
						var lineNum = 1;

						assert.isTrue(result);
						assert.startsWith(re.getMessage(result, rule, context), 'These arguments should each be on their own line');
						assert.equal(content, re.replaceItem(result, rule, context));
					}
				);

				var shouldNotMatch = ['fire(', 'setTimeout(function(){})', 'alert({})', 'function("foo"'];

				shouldNotMatch.forEach(
					function(content, index) {
						var context = {
							content: content
						};

						assert.isFalse(re.testContent(rule, context));
					}
				);
			}
		);

		it(
			'should detect invalid conditional format',
			function() {
				var rule = re.rules.js.invalidConditional;

				var input = 'if (){';
				var output = 'if () {';
				var expectedWarning = 'Needs a space between ")" and "{"';

				var context = {
					content: input
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(result, rule, context));
			}
		);

		it(
			'should detect invalid function format',
			function() {
				var rule = re.rules.js.invalidFunctionFormat;

				var input = 'function () {';
				var output = 'function() {';
				var expectedWarning = 'Anonymous function expressions should be formatted as function(';

				var context = {
					content: input
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(result, rule, context));
			}
		);

		it(
			'should detect invalid keyword format',
			function() {
				var rule = re.rules.js.keywordFormat;

				var input = 'while() {';
				var output = 'while () {';
				var expectedResult = ['while(', 'while', '('];

				var context = {
					content: input
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.deepEqual(expectedResult, _.toArray(result));

				assert.equal(output, re.replaceItem(result, rule, context));
			}
		);

		it(
			'should detect variables passed to Liferay.Language.get',
			function() {
				var rule = re.rules.js.liferayLanguageVar;

				var input = 'Liferay.Language.get(foo)';
				var output = input;
				var expectedWarning = 'You should never pass variables to Liferay.Language.get()';

				var context = {
					content: input
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(result, rule, context));

				context.content = 'Liferay.Language.get("foo")';
				assert.isFalse(re.testContent(rule, context));
			}
		);

		it(
			'should detect invalid logging statements',
			function() {
				var rule = re.rules.js.logging;

				var shouldMatch = ['console.trace()', 'console.log()', 'console.dir()'];

				shouldMatch.forEach(
					function(content, index) {
						var context = {
							content: content
						};

						var result = re.testContent(rule, context);
						var lineNum = 1;

						assert.isTrue(result);
						assert.startsWith(re.getMessage(result, rule, context), 'Debugging statement');
						assert.equal(content, re.replaceItem(result, rule, context));
					}
				);
			}
		);

		it(
			'should detect invalid variable line spacing',
			function() {
				var rule = re.rules.js.varLineSpacing;

				var input = 'var foo = 1;';
				var output = input;
				var expectedWarning = 'Variable declaration needs a new line after it';

				var context = {
					content: input,
					nextItem: 'instance.foo()'
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(result, rule, context));

				context.nextItem = '';
				assert.isFalse(re.testContent(rule, context));
				context.nextItem = input;
				assert.isFalse(re.testContent(rule, context));
			}
		);

	}
);