var chai = require('chai');

chai.use(require('chai-string'));

var re = require('../../lib/re');

var assert = chai.assert;

describe(
	'HTML JS Rule Engine Tests',
	function() {
		'use strict';

		it(
			'should handle Liferay.Language.get()',
			function() {
				var rule = re.rules.htmlJS.liferayLanguage;

				var item = 'Liferay.Language.get(\'foo\');';

				var context = {
					fullItem: item,
					item: item
				};

				var result = re.testLine(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(lineNum, result, rule, context), rule.message.split(':')[0]);
				assert.equal(item, re.replaceItem(lineNum, result, rule, context));
			}
		);

		it(
			'should handle Liferay.provide()',
			function() {
				var rule = re.rules.htmlJS.liferayProvide;

				var item = 'Liferay.provide(window, \'foo\', function() {}, []);';

				var context = {
					asyncAUIScript: true,
					fullItem: item,
					item: item
				};

				var result = re.testLine(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(lineNum, result, rule, context), rule.message.split(':')[0]);
				assert.equal(item, re.replaceItem(lineNum, result, rule, context));
			}
		);
	}
);