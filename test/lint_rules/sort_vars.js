var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var addES6 = function(item, index) {
	item.parserOptions = {
		ecmaVersion: 6,
		ecmaFeatures: {}
	};

	return item;
};

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'var xyz = 123;',
			'var abc = 123;\nvar def = 456;',
			'var abc = 123; var def = 456;',
			'var cde = 123;\nvar def = 123;\n\nvar abc = 456;',
			'for (var i = 0; i < 10; i++) {\nvar current = 1;\n}',
			'for (var i in obj) {\nvar current = 1;\n}'
		].concat(
			[
				{ code: 'const {bar, foo} = refs;' },
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
			}
		].concat(
			[
				{
					code: 'const {foo, bar} = refs',
					errors: [ { message: 'Sort variables: foo bar' } ]
				}
			].map(addES6)
		)
	}
);