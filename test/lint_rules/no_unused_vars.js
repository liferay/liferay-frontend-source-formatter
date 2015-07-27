var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

var args = [2, {'jsp': true}];

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var _PN_xyz = 1;',
			{
				code: '(function(){ var _PN_xyz = function(){}; });',
				args: args
			},
			{
				code: '(function(){ function _PN_xyz(){} })',
				args: args
			},
		],

		invalid: [
			{
				code: '(function(){ var _PN_xyz = 1; });',
				errors: [ { message: '_PN_xyz is defined but never used' } ],
				args: args
			}
		]
	}
);