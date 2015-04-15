var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'_PN_foo()',
			'_PN_()',
			'_PN_.foo',
			'var a = _PN_;'
		],

		invalid: [
			{
				code: 'var a = b;',
				errors: [ { message: '"b" is not defined.' } ]
			}
		]
	}
);