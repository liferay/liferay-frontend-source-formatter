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
			';(function(){});'
		],

		invalid: [
			{ code: ';;(function(){});', errors: [{ message: 'Unnecessary semicolon.'}] }
		]
	}
);