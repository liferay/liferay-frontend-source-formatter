var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

var invalidTests = ['1', 'function(){}', '/f/', 'new Date()', 'foo'].map(
	function(item, index) {
		return {
			code: 'Liferay.Language.get(' + item + ')',
			errors: [ { message: 'You should only pass a single string literal to Liferay.Language.get()' } ]
		}
	}
);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
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