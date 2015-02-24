var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/rules/' + path.basename(__filename)),
	{
		valid: [
			'({requires: ["a", "b"]})'
		],

		invalid: [
			{
				code: '({requires: ["b", "a"]})',
				errors: [ { message: 'Sort modules in "requires" array: b > a' } ]
			},
			{
				code: '({requires: ["b", "c", "a"]})',
				errors: [ { message: 'Sort modules in "requires" array: c > a' } ]
			}
		]
	}
);