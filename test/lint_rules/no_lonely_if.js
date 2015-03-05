var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'if (a) {;} else if (b) {;}',
			'if (a) {;} else { if (b) {;} ; }',
			'if (a) { if (b) {;} ; } else { ; }',
			'if (a) { if (b) {;} else { ; } } else { ; }',
			'if (a) { ; } else { if (b) {;} else { ; } }'
		],

		invalid: [
			{
				code: 'if (a) {;} else { if (b) {;} }',
				errors: [
					{
						message: 'Unexpected if as the only statement in an else block.',
						type: 'IfStatement'
					}
				]
			},
			{
				code: 'if (a) { if (b) {;} }',
				errors: [
					{
						message: 'Unexpected if as the only statement in an if block.',
						type: 'IfStatement'
					}
				]
			}
		]
	}
);