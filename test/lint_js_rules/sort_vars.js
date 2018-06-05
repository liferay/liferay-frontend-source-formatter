var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var addES6 = require('../test_utils').addES6(
	{
		ecmaFeatures: {},
		sourceType: 'module'
	}
);

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'var xyz = 123;',
			'var abc = 123;\nvar def = 456;',
			'var abc = 123; var def = 456;',
			'var cde = 123;\nvar def = 123;\n\nvar abc = 456;',
			'var cde = 123;\nvar def = foo();\n\nvar abc = bar(def);',
			'var cde = 123;\nvar def = window.foo();\n\nvar abc = window.bar(def);',
			'for (var i = 0; i < 10; i++) {\nvar current = 1;\n}',
			'for (var i in obj) {\nvar current = 1;\n}'
		].concat(
			[
				{ code: 'const {bar, foo} = refs;' },
				{ code: 'import Foo, {bar, baz} from "somefile";' },
				{ code: 'import Foo, {bar as doo, baz} from "somefile";' },
				{ code: 'import Foo from "somefile";' },
				{ code: 'import "somefile";' },
				{ code: 'const [foo, bar] = refs;' }/*,
				Need to add the below as soon as I figure out what to do about es7/babel-eslint, etc
				{ code: 'const {foo, ...bar} = refs;' }*/
			].map(addES6)
		),

		invalid: [
			{
				code: 'var def = 456;\nvar abc = 123;',
				errors: [ { message: 'Sort variables: def abc' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz = "FOO";\nvar abc = 123;',
				errors: [ { message: 'Sort variables: def_xyz abc' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz = foo();\nvar abc = def_xyz.bar();',
				errors: [ { message: 'Sort variables: def_xyz abc. If you\'re using "def_xyz" in assigning a value to "abc", add a newline between them.' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz = window.foo;\nvar abc = def_xyz.bar;',
				errors: [ { message: 'Sort variables: def_xyz abc. If you\'re using "def_xyz" in assigning a value to "abc", add a newline between them.' } ]
			},
			{
				code: 'var def = 456;\nvar abc = def++;',
				errors: [ { message: 'Sort variables: def abc. If you\'re using "def" in assigning a value to "abc", add a newline between them.' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz =[];\nvar abc = [];',
				errors: [ { message: 'Sort variables: def_xyz abc' } ]
			},
			{
				code: 'var def = 456;\n\nvar def_xyz ={};\nvar abc = {};',
				errors: [ { message: 'Sort variables: def_xyz abc' } ]
			}
		].concat(
			[
				{
					code: 'const {foo, bar} = refs',
					errors: [ { message: 'Sort variables: foo bar' } ]
				},
				{
					code: 'import Foo, {baz, bar} from "somefile";',
					errors: [ { message: 'Sort imported members: baz bar' } ]
				}
			].map(addES6)
		)
	}
);