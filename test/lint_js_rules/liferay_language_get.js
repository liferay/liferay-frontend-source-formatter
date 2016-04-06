var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var invalidTests = ['1', 'function(){}', '/f/', 'new Date()', 'foo'].map(
	function(item, index) {
		return {
			code: 'Liferay.Language.get(' + item + ')',
			errors: [ { message: 'You should only pass a single string literal to Liferay.Language.get()' } ]
		}
	}
);

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'Liferay.Language.get("foo")',
			'Liferay.Language.get(\'foo\')'
		],

		invalid: invalidTests.concat([
			{
				code: 'Liferay.Language.get()',
				errors: [ { message: 'Liferay.Language.get() only accepts a single string as an argument' } ]
			},
			{
				code: 'Liferay.Language.get("foo", name)',
				errors: [ { message: 'Liferay.Language.get() only accepts a single string as an argument' } ]
			}
		])
	}
);