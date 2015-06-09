var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'Liferay.provide(window, "foo", function(){}, ["dep"])',
			'Liferay.provide(Liferay.Util, "foo", function(){}, ["dep"])',
			'Liferay.provide(window, str, function(){}, ["dep"])',
			'Liferay.provide(window, "foo", fooFn, ["dep"])',
			'Liferay.provide(window, "foo", fooFn, ["dep"].concat("foo"))',
		],

		invalid: [
			{
				code: 'Liferay.provide(window, "foo", function(){})',
				errors: [ { message: 'Missing dependencies (don\'t use Liferay.provide to create regular functions).' } ]
			},
			{
				code: 'Liferay.provide(null, "foo", function(){}, ["dep"])',
				errors: [ { message: 'Liferay.provide expects an object as the first argument.' } ]
			},
			{
				code: 'Liferay.provide(window, null, function(){}, ["dep"])',
				errors: [ { message: 'Liferay.provide expects a string as the second argument.' } ]
			},
			{
				code: 'Liferay.provide(window, "foo", {}, ["dep"])',
				errors: [ { message: 'Liferay.provide expects a function as the third argument.' } ]
			},
			{
				code: 'Liferay.provide(window, "foo", function(){}, "foo")',
				errors: [ { message: 'Liferay.provide expects an array as the last argument.' } ]
			},
			{
				code: 'Liferay.provide(window, "foo", function(){}, "foo".toLowerCase())',
				errors: [ { message: 'Liferay.provide expects an array as the last argument.' } ]
			},
			{
				code: 'Liferay.provide(window, "foo", function(){}, [])',
				errors: [ { message: 'Liferay.provide dependencies should have at least one dependency.' } ]
			}
		]
	}
);