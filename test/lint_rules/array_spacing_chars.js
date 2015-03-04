var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

var STR_ERROR = 'Array items should be separated by exactly one space:';

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
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