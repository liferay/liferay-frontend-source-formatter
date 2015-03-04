var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var x = 1;\nvar y = 2;',
			'var x;\nvar y;'
		],

		invalid: [
			{
				code: 'var x = 2, y = 2;',
				errors: [ { message: 'Each variable should have it\'s own var statement: x, y' } ]
			},
			{
				code: 'var x, y;',
				errors: [ { message: 'Each variable should have it\'s own var statement: x, y' } ]
			}
		]
	}
);