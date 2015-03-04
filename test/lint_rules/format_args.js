var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);
/*
alert({}, 1);
alert(function() {}, 1);
alert(
function() {
},
1
);

alert(function() {
}, 1, 2);

alert(
1, 2, 3
);

alert(
);

alert(function() {
},
1);

alert(function() {
},
1
);

alert(function() {
});

alert(function() {alert('foo');}, 1);
alert({x: 1}, 1);
*/
eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'alert();',
			'alert({}, 1);',
			'alert(function() {}, 1);',
			'alert(\nfunction() {\n},\n1\n);',
			'(function foo(){\n}());',
			'(function(){\n}(\n));'
		],

		invalid: [
			{
				code: 'alert(function() {\n}, 1, 2);',
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: 'alert(\n1, 2, 3\n);',
				errors: [ { message: 'Function call can be all on one line: alert(...)' } ]
			},
			{
				code: 'alert(\n);',
				errors: [ { message: 'Function call without arguments should be on one line: alert()' } ]
			},
			{
				code: 'alert(function() {\n},\n1);',
				errors: [ { message: 'Args should each be on their own line (args on end line): alert(...)' } ]
			},
			{
				code: 'alert(function() {\n},\n1\n);',
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: 'alert(function() {\n});',
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: 'alert(function() {alert(\'foo\');}, 1);',
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: 'alert({x: 1}, 1);',
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: 'AUI()[\'add\'](function(){\n});',
				errors: [ { message: 'Args should each be on their own line (args on start line): AUI(...)' } ]
			},
			{
				code: '(function(){\n}(\n{x: 1},2,3\n));',
				errors: [ { message: 'Args should each be on their own line (args on same line): <anonymous>(...)' } ]
			}
		]
	}
);