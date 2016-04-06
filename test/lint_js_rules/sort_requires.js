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
			'({requires: []})',
			'({requires: ["a"]})',
			'({requires: ["a", "b"]})',
			'({requires: ["a", xyz, "b"]})',
			'({required: []})',
			'({requires: 1})'
		],

		invalid: [
			{
				code: '({requires: ["b", "a"]})',
				errors: [ { message: 'Sort modules in "requires" array: b > a' } ]
			},
			{
				code: '({requires: ["b", "c", "a"]})',
				errors: [ { message: 'Sort modules in "requires" array: c > a' } ]
			}
		]
	}
);