var chai = require('chai');

chai.use(require('chai-string'));

var RE = require('../../lib/re');

var re = new RE(require('../../lib/rules'));

var assert = chai.assert;

describe(
	'HTML JS Rule Engine Tests',
	function() {
		'use strict';

		it(
			'should handle Liferay.Language.get()',
			function() {
				var rule = re.rules.htmlJS.liferayLanguage;

				var content = 'Liferay.Language.get(\'foo\');';

				var context = {
					content: content
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), rule.message.split(':')[0]);
				assert.equal(content, re.replaceItem(result, rule, context));
			}
		);

		it(
			'should handle Liferay.provide()',
			function() {
				var rule = re.rules.htmlJS.liferayProvide;

				var content = 'Liferay.provide(window, \'foo\', function() {}, []);';

				var context = {
					asyncAUIScript: true,
					content: content
				};

				var result = re.testContent(rule, context);
				var lineNum = 1;

				assert.isTrue(result);
				assert.startsWith(re.getMessage(result, rule, context), rule.message.split(':')[0]);
				assert.equal(content, re.replaceItem(result, rule, context));
			}
		);
	}
);