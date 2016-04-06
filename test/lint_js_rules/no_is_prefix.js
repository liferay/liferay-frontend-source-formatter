var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var STR_ERROR = 'Variable/property names should not start with is*: ';

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'var isString = A.Lang.isString;',
			'var isString = Lang.isString;',
			'var isString = function(){};',
			'var o = {isString: function(){}}',
			'var o = {isString: A.Lang.isString}',
			'var o = {isString: Lang.isString}',
			'var o = {isFoo: Lang.emptyFn}',
			'var o = {isFoo: Lang.emptyFnTrue}',
			'var o = {isFoo: Lang.emptyFnFalse}'
		],

		invalid: [
			{
				code: 'var isString;',
				errors: [ { message: STR_ERROR + 'isString' } ]
			},
			{
				code: 'var isString = 1;',
				errors: [ { message: STR_ERROR + 'isString' } ]
			},
			{
				code: 'var o = {isString: 1}',
				errors: [ { message: STR_ERROR + 'isString' } ]
			},
			{
				code: 'var o = {isString: isFoo}',
				errors: [ { message: STR_ERROR + 'isString' } ]
			},
			{
				code: 'function foo(isString){}',
				errors: [ { message: STR_ERROR + 'isString' } ]
			},
			{
				code: 'var x = function(isString){}',
				errors: [ { message: STR_ERROR + 'isString' } ]
			}
		]
	}
);