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
				var rule = re.htmlJS.liferayLanguage;

				var item = 'Liferay.Language.get(\'foo\');';

				var context = {
					item: item
				};

				var result = re.testLine(rule, item, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(lineNum, item, result, rule, context), rule.message.split(':')[0]);
				assert.equal(item, re.replaceItem(lineNum, item, result, rule, context));
			}
		);

		it(
			'should handle Liferay.provide()',
			function() {
				var rule = re.htmlJS.liferayProvide;

				var item = 'Liferay.provide(window, \'foo\', function() {}, []);';

				var context = {
					asyncAUIScript: true,
					item: item
				};

				var result = re.testLine(rule, item, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(lineNum, item, result, rule, context), rule.message.split(':')[0]);
				assert.equal(item, re.replaceItem(lineNum, item, result, rule, context));
			}
		);
	}
);