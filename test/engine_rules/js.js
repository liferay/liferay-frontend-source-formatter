var path = require('path');
var fs = require('fs');
var chai = require('chai');
var _ = require('lodash');

chai.use(require('chai-string'));

var re = require('../lib/re');

var assert = chai.assert;

describe(
	'JS Rule Engine Tests',
	function () {
		'use strict';

		it(
			'should detect and replace improper else format',
			function() {
				var rule = re.js.elseFormat;

				var input = '} else {';
				var output = '}\nelse {';
				var expectedResult = ['} else', undefined, 'else'];

				var context = {
					item: input
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.deepEqual(expectedResult, _.toArray(result));

				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));
			}
		);

		it(
			'should detect invalid argument format',
			function() {
				var rule = re.js.invalidArgumentFormat;

				var shouldMatch = ['fire("foo",', 'setTimeout(function(', 'alert({'];

				shouldMatch.forEach(
					function(item, index) {
						var context = {
							item: item
						};

						var result = re.testLine(rule, item, context);
						var lineNum = 1;

						assert.isTrue(result);
						assert.startsWith(re.getWarning(lineNum, item, result, rule, context), 'These arguments should each be on their own line');
						assert.equal(item, re.replaceItem(lineNum, item, result, rule, context));
					}
				);

				var shouldNotMatch = ['fire(', 'setTimeout(function(){})', 'alert({})', 'function("foo"'];

				shouldNotMatch.forEach(
					function(item, index) {
						var context = {
							item: item
						};

						assert.isFalse(re.testLine(rule, item, context));
					}
				);
			}
		);

		it(
			'should detect invalid conditional format',
			function() {
				var rule = re.js.invalidConditional;

				var input = 'if (){';
				var output = 'if () {';
				var expectedWarning = 'Needs a space between ")" and "{"';

				var context = {
					item: input
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getWarning(lineNum, input, result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));
			}
		);

		it(
			'should detect invalid function format',
			function() {
				var rule = re.js.invalidFunctionFormat;

				var input = 'function () {';
				var output = 'function() {';
				var expectedWarning = 'Anonymous function expressions should be formatted as function(';

				var context = {
					item: input
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getWarning(lineNum, input, result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));
			}
		);

		it(
			'should detect invalid keyword format',
			function() {
				var rule = re.js.keywordFormat;

				var input = 'while() {';
				var output = 'while () {';
				var expectedResult = ['while(', 'while', '('];

				var context = {
					item: input
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.deepEqual(expectedResult, _.toArray(result));

				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));
			}
		);

		it(
			'should detect variables passed to Liferay.Language.get',
			function() {
				var rule = re.js.liferayLanguageVar;

				var input = 'Liferay.Language.get(foo)';
				var output = input;
				var expectedWarning = 'You should never pass variables to Liferay.Language.get()';

				var context = {
					item: input
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getWarning(lineNum, input, result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));

				context.item = 'Liferay.Language.get("foo")';
				assert.isFalse(re.testLine(rule, context.item, context));
			}
		);

		it(
			'should detect invalid logging statements',
			function() {
				var rule = re.js.logging;

				var shouldMatch = ['console.trace()', 'console.log()', 'console.dir()'];

				shouldMatch.forEach(
					function(item, index) {
						var context = {
							item: item
						};

						var result = re.testLine(rule, item, context);
						var lineNum = 1;

						assert.isTrue(result);
						assert.startsWith(re.getWarning(lineNum, item, result, rule, context), 'Debugging statement');
						assert.equal(item, re.replaceItem(lineNum, item, result, rule, context));
					}
				);
			}
		);

		it(
			'should detect invalid variable line spacing',
			function() {
				var rule = re.js.varLineSpacing;

				var input = 'var foo = 1;';
				var output = input;
				var expectedWarning = 'Variable declaration needs a new line after it';

				var context = {
					item: input,
					nextItem: 'instance.foo()'
				};

				var result = re.testLine(rule, input, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getWarning(lineNum, input, result, rule, context), expectedWarning);
				assert.equal(output, re.replaceItem(lineNum, input, result, rule, context));

				context.nextItem = '';
				assert.isFalse(re.testLine(rule, input, context));
				context.nextItem = input;
				assert.isFalse(re.testLine(rule, input, context));
			}
		);

	}
);