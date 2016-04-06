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