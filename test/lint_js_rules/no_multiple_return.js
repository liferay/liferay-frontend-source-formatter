var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var addES6 = require('../test_utils').addES6();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'function foo() {return 1;}',
			'function foo() {}',
			'function foo() {bar();}',
			'function foo() {var f = function(){return 1;}; return f();}',
			'function foo() {var f = function(){return 1;};}'
		].concat(
			[
				{ code: 'var foo = () => {return 1;}' },
				{ code: 'var foo = () => {}' },
				{ code: 'var foo = () => {bar();}' },
				{ code: 'var foo = () => {var f = n => {return 1}; return f();}' },
				{ code: 'var foo = () => {var f = n => {return 1};}' },

			].map(addES6)
		),

		invalid: [
			{
				code: 'function foo() {if (x) {return x;} return;}',
				errors: [ { message: 'Functions should only have one return statement' } ]
			},
			{
				code: 'function foo() {if (x) {return x;} else {return 1;}}',
				errors: [ { message: 'Functions should only have one return statement' } ]
			},
			{
				code: 'function foo() {return 1; return 2;}',
				errors: [ { message: 'Functions should only have one return statement' } ]
			},
			{
				code: 'function foo() {var f = function(){if (foo) {return foo;} return 1;};}',
				errors: [ { message: 'Functions should only have one return statement' } ]
			}
		].concat(
			[
				{
					code: 'var foo = () => {if (x) {return x;} return;}',
					errors: [ { message: 'Functions should only have one return statement' } ]
				},
				{
					code: 'var foo = () => {if (x) {return x;} else {return 1;}}',
					errors: [ { message: 'Functions should only have one return statement' } ]
				},
				{
					code: 'var foo = () => {return 1; return 2;}',
					errors: [ { message: 'Functions should only have one return statement' } ]
				},
				{
					code: 'var foo = () => {var f = () => {if (foo) {return foo;} return 1;};}',
					errors: [ { message: 'Functions should only have one return statement' } ]
				}
			]
		).map(addES6)
	}
);