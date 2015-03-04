var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'[1, 2, 3]'
		],

		invalid: [
			{
				code: '[ 1, 2, 3]',
				errors: [ { message: 'Remove leading spaces: [ ...' } ]
			},
			{
				code: '[1, 2, 3 ]',
				errors: [ { message: 'Remove trailing spaces: ... ]' } ]
			},
			{
				code: '[ 1, 2, 3 ]',
				errors: [ { message: 'Remove leading and trailing spaces: [ ... ]' } ]
			}
		]
	}
);