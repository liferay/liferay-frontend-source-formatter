var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var xyz = 123;',
			'var abc = 123;\nvar def = 456;',
			'var abc = 123; var def = 456;',
			'var cde = 123;\nvar def = 123;\n\nvar abc = 456;',
			'for (var i = 0; i < 10; i++) {\nvar current = 1;\n}',
			'for (var i in obj) {\nvar current = 1;\n}'
		],

		invalid: [
			{
				code: 'var def = 456;\nvar abc = 123;',
				errors: [ { message: 'Sort variables: def abc' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz = "FOO";\nvar abc = 123;',
				errors: [ { message: 'Sort variables: def_xyz abc' } ]
			}
		]
	}
);