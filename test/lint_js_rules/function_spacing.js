var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var STR_END_ERROR = 'There should be exactly one line between the last statement and the end of the function, not ';

var STR_START_ERROR = 'There should be exactly one line between the start of the function and the first statement, not ';

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'function foo() {}',
			'function foo() {\n}',
			'function foo() {\nalert("test");\n}',
			'function foo() {\n/*Test*/\nalert("test");\n}',
			'function foo() {\nalert("test");\n/*Test*/\n}',
			'function foo() {\n/*Test*/\nalert("test");\n/*Test*/\n}',
			'function foo() {\n// Test\nalert("test");\n// Test\n}',
		],

		invalid: [
			{
				code: 'function foo() {\n\nalert("test");\n}',
				errors: [ { message: STR_START_ERROR + '2 lines' } ]
			},
			{
				code: 'function foo() {\nalert("test");\n\n}',
				errors: [ { message: STR_END_ERROR + '2 lines' } ]
			},
			{
				code: 'function foo() {alert("test");\n}',
				errors: [ { message: STR_START_ERROR + '0 lines' } ]
			},
			{
				code: 'function foo() {\nalert("test");}',
				errors: [ { message: STR_END_ERROR + '0 lines' } ]
			},
			{
				code: 'function foo() {\n/*Test*/\n\nalert("test");\n}',
				errors: [ { message: STR_START_ERROR + '2 lines' } ]
			},
			{
				code: 'function foo() {\n\n/*Test*/\nalert("test");\n}',
				errors: [ { message: STR_START_ERROR + '2 lines' } ]
			},
			{
				code: 'function foo() {\nalert("test");\n/*Test*/\n\n}',
				errors: [ { message: STR_END_ERROR + '2 lines' } ]
			},
			// {
				// code: 'function foo() {\n/*Test*/\n\n/*Test*/\nalert("test");\n}',
				// errors: [ { message: STR_START_ERROR + '2 lines' } ]
			// },
			// {
				// code: 'function foo() {\nalert("test");\n/*Test*/\n\n/*Test*/\n}',
				// errors: [ { message: STR_END_ERROR + '2 lines' } ]
			// }
		]
	}
);