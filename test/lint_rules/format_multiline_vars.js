var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var FOO1;',
			'var FOO1 = \'\';',
			'var FOO1 = \'something\' +\n\t\'else\';',
			'var FOO1 = \'something\' +\n\tLiferay.foo();',
			'var FOO1 = \'something\' +\n\tLiferay.foo() + \'foo\';',
			'FOO1 = \'\';',
			'FOO1 = \'something\' +\n\'else\';',
			'FOO1 = \'something\' +\nLiferay.foo();',
			'FOO1 = \'something\' +\nLiferay.foo() + \'foo\';',
			'FOO1 = (\nbar && baz\n);'
		],

		invalid: [
			{
				code: 'var FOO1 = \'something\' +\n\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 = \'something\' +\n\t\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 = \'something\' +\n\t\tLiferay.foo();',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\t\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\'something\';',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\tLiferay.foo();',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n\'something\' +\nLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: '\tFOO1 =\n\t\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n\'something\';',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n(\nbar && baz\n);',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			}
		]
	}
);