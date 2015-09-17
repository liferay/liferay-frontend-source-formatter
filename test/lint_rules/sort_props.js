var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'({init: function(){}, initializer: function(){}, renderUI: function(){}, bindUI: function(){}, syncUI: function(){}, destructor: function(){}})',
			'({init: function(){}, initializer: function(){}, renderUI: function(){}, bindUI: function(){}, syncUI: function(){}, destructor: function(){}, abc: function(){}})',
			'({ 0: 1, "$xyz": 1, abc: 2 })',
			'({ 0: 1, "@xyz": 1, abc: 2})',
			'({ a: 1,\nb: 2,\n\na:3})',
			'({ ATTRS: {a: 1,\n\nb: 2,}})',
			'({ ATTRS: {a: 1,\nb: 2,}})',
			{
				code: '({initString: 1, initsTriangle: 2})',
				args: [2, {'casesensitive': true}]
			},
			{
				code: '({initsTriangle: 1, initString: 2})',
				args: [2, {'casesensitive': false}]
			}
		],

		invalid: [
			{
				code: '({abc: function(){}, init: function(){}, initializer: function(){}, renderUI: function(){}, bindUI: function(){}, syncUI: function(){}, destructor: function(){}})',
				errors: [ { message: 'Sort properties: abc init (Lifecycle methods should come first)' } ]
			},
			{
				code: '({initString: 1, initsTriangle: 2})',
				errors: [ { message: 'Sort properties: initString initsTriangle' } ]
			},
			{
				code: '({getFoo: 1, getAbc: 2})',
				errors: [ { message: 'Sort properties: getFoo getAbc' } ]
			},
			{
				code: '({_getFoo: 1, _getAbc: 2})',
				errors: [ { message: 'Sort properties: _getFoo _getAbc' } ]
			},
			{
				code: '({_getFoo: function(){},\n\n_getAbc: function(){}})',
				errors: [ { message: 'Sort properties: _getFoo _getAbc' } ]
			},
			{
				code: '({_getFoo: 1, _getAbc: 2})',
				errors: [ { message: 'Sort properties: _getFoo _getAbc' } ]
			},
			{
				code: '({_getFoo: 1, getAbc: 2})',
				errors: [ { message: 'Sort properties: _getFoo getAbc' } ]
			},
			{
				code: '({_getFoo: function(){},\n\n getAbc: function(){}})',
				errors: [ { message: 'Sort properties: _getFoo getAbc' } ]
			},
			{
				code: '({ ATTRS: {z: 1,\n\nb: {}}})',
				errors: [ { message: 'Sort properties: z b' } ]
			}
		]
	}
);