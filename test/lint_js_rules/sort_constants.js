var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'var ABC = 123;\n\nvar DEF = 456;',
			'var DEF = 456;\n\nvar ABC = "FOO" + DEF;',
			'var DEF = 456;\n\nvar GHI = 789;\n\nvar ABC = DEF;',
			'var DEF = 456;\n\nvar ABC = some.method[DEF];',
			'var DEF = function(){};\n\nvar ABC = DEF();',
			'var DEF = function(){};\n\nvar ABC = foo(DEF);'
		],

		invalid: [
			{
				code: 'var DEF = 456;\n\nvar ABC = 123;',
				errors: [ { message: 'Sort constants: DEF ABC' } ]
			},
			{
				code: 'var DEF = 456;\n\nvar DEF_XYZ = "FOO";\n\nvar ABC = 123;',
				errors: [ { message: 'Sort constants: DEF_XYZ ABC' } ]
			},
			{
				code: 'var DEF = 456;\n\nvar ABC = "DEF";',
				errors: [ { message: 'Sort constants: DEF ABC' } ]
			},
			{
				code: 'var DEF = 456;\n\nvar ABC;',
				errors: [ { message: 'Sort constants: DEF ABC' } ]
			}
		]
	}
);