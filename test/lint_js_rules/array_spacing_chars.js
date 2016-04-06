var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var STR_ERROR = 'Array items should be separated by exactly one space:';

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'[1, 2, 3]',
			'[1,\n2]'
		],

		invalid: [
			{
				code: '[1,2,3]',
				errors: [ { message: STR_ERROR + '[1,2,3' } ]
			},
			{
				code: '[1,  2, 3]',
				errors: [ { message: STR_ERROR + '[1,  2' } ]
			},
			{
				code: '["1",  "2", "3"]',
				errors: [ { message: STR_ERROR + '["1",  "' } ]
			},
			{
				code: '[\'1\',  \'2\', \'3\']',
				errors: [ { message: STR_ERROR + '[\'1\',  \'' } ]
			},
			{
				code: '[1,	2, 3]',
				errors: [ { message: STR_ERROR + '[1,\\t' } ]
			},
			{
				code: '["1",	"2", "3"]',
				errors: [ { message: STR_ERROR + '["1",\\t' } ]
			},
			{
				code: '[\'1\',	\'2\', \'3\']',
				errors: [ { message: STR_ERROR + '[\'1\',\\t' } ]
			}
		]
	}
);