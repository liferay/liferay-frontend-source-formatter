var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();
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
firstFn(arg1)(
     secondFn(arg2)(
          thirdFn()
     )
)
*/
ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'alert();',
			'alert({}, 1);',
			'alert(function() {}, 1);',
			'alert(\nfunction() {\n},\n1\n);',
			'(function foo(){\n}());',
			'(function(){\n}(\n));',
			'alert(\n{\nx: 1\n}\n)(foo);',
			'firstFn(arg1)(\nsecondFn(arg2)(\nthirdFn(\nfourthFn(arg3)(\nfifthFn()\n)\n)\n)\n)',
			'firstFn(arg1)(\nsecondFn(\n{\nx: 1\n}\n)(\nthirdFn()\n)\n)',
			// I need to come back to this test...
			// It passes if the identifier is the last argument,
			// but fails when it's the first.
			// I also wonder about variations of this, like (var, fn, var) or (fn, var, obj, var), etc
			// UPDATE: (var, obj), (fn, var, fn), and (fn, var, obj) fail as well
			// '(function(arg1) {\nreturn function(){\n};\n})(\nobj,\nfunction(exp){\nreturn "";\n}\n);'
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
			},
			{
				code: 'alert({\nx: 1\n})(foo);',
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: 'alert()(foo, {\nx: 1\n});',
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: 'firstFn(arg1)(secondFn(arg2)(\nthirdFn(\nfourthFn(arg3)(\nfifthFn()\n)\n)\n)\n)',
				errors: [ { message: 'Args should each be on their own line (args on start line): firstFn(...)' } ]
			},
			{
				code: 'firstFn(arg1)(\nsecondFn(arg2)(\nthirdFn(\nfourthFn(arg3)(\nfifthFn()\n)\n)\n))',
				errors: [ { message: 'Args should each be on their own line (args on end line): firstFn(...)' } ]
			},
			{
				code: 'firstFn(arg1)(\nsecondFn(arg2)(\nthirdFn(\nfourthFn(\n{\nx: 1\n})(\nfifthFn()\n)\n)\n)\n)',
				errors: [ { message: 'Args should each be on their own line (args on end line): fourthFn(...)' } ]
			},
			{
				code: '(function(arg1) {\nreturn function(){};\n})(obj, function(exp){\n});',
				errors: [ { message: 'Args should each be on their own line (args on same line): <anonymous>(...)' } ]
			}
		]
	}
);