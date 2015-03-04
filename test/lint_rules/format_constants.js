var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var FOO1 = \'\';\n\nvar FOO2 = \'\';'
		],

		invalid: [
			{
				code: 'var FOO1 = \'\';\nvar FOO2 = \'\';',
				errors: [ { message: 'Constants should be separated by a single new line' } ]
			},
			{
				code: 'var FOO1 = \'\';var FOO2 = \'\';',
				errors: [ { message: 'Constants should be separated by a single new line' } ]
			}
		]
	}
);