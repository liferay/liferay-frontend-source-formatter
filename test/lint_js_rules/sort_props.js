var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var addES6 = require('../test_utils').addES6(
	{
		ecmaFeatures: {
			experimentalObjectRestSpread: true
		}
	}
);

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
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
				options: [{'casesensitive': true}]
			},
			{
				code: '({initsTriangle: 1, initString: 2})',
				options: [{'casesensitive': false}]
			}
		].concat(
			[
				{ code: '({[bar]: 1, [foo]: 1})' },
				{ code: '({a: 1, [bar()]: 1, [foo]: 1, [obj.bar()]: 1, [obj.foo]: 1, [str + \'other\']: 1 })' },
				{ code: '({...baz, bar: 1, foo})' },
			].map(addES6)
		),

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
		].concat(
			[
				{
					code: '({[foo]: 1, [bar]: 1})',
					errors: [ { message: 'Sort properties: [foo] [bar]' } ]
				},
				{
					code: '({a: 1, [str + \'other\']: 1, [bar()]: 1, [foo]: 1, [obj.bar()]: 1, [obj.foo]: 1 })',
					errors: [ { message: 'Sort properties: [str + \'other\'] [bar()]' } ]
				},
			].map(addES6)
		)
	}
);