var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_rules/' + path.basename(__filename)),
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
				errors: [ { message: "'b' is not defined." } ]
			}
		]
	}
);