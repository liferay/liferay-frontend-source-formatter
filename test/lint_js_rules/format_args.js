var path = require('path');

var lint = require('../../lib/lint_js');

var testUtils = require('../test_utils');

var nl = testUtils.nl;

var addES6 = testUtils.addES6();

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

			nl('alert(',
				'function() {',
				'},',
				'1',
			');'),

			nl('(function foo(){',
			'}());'),

			nl('(function(){',
				'}(',
				'));'),

			nl('alert(',
				'{',
					'x: 1',
				'}',
			')(foo);'),
			nl('firstFn(arg1)(',
				'secondFn(arg2)(',
				'thirdFn(',
					'fourthFn(arg3)(',
						'fifthFn()',
					')',
				')',
				')',
			')'),
			nl('firstFn(arg1)(',
				'secondFn(',
					'{',
						'x: 1',
					'}',
				')(',
					'thirdFn()',
				')',
			')'),
			// I need to come back to this test...
			// It passes if the identifier is the last argument,
			// but fails when it's the first.
			// I also wonder about variations of this, like (var, fn, var) or (fn, var, obj, var), etc
			// UPDATE: (var, obj), (fn, var, fn), and (fn, var, obj) fail as well
			// nl('(function(arg1) {',
			// 		'return function(){',
			// 		'};',
			// 	'})(',
			// 		'obj,',
			// 		'function(exp){',
			// 			'return "";',
			// 		'}',
			// ');')
		].concat(
			[
				{ code: nl(
					'doSomethingPromisable()',
					'.then((foo) => doSomethingMorePromisable(foo))',
					'.then((bar) => finish(bar))'
					)
				}
			].map(addES6)
		),

		invalid: [
			{
				code: nl('alert(function() {',
						'}, 1, 2);'),
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: nl('alert(',
							'1, 2, 3',
						');'),
				errors: [ { message: 'Function call can be all on one line: alert(...)' } ]
			},
			{
				code: nl('alert(',
						');'),
				errors: [ { message: 'Function call without arguments should be on one line: alert()' } ]
			},
			{
				code: nl('alert(function() {',
						'},',
						'1);'),
				errors: [ { message: 'Args should each be on their own line (args on end line): alert(...)' } ]
			},
			{
				code: nl('alert(function() {',
							'},',
						'1',
						');'),
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: nl('alert(function() {',
						'});'),
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: nl('alert(function() {alert(\'foo\');}, 1);'),
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: 'alert({x: 1}, 1);',
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: nl('AUI()[\'add\'](function(){',
						'});'),
				errors: [ { message: 'Args should each be on their own line (args on start line): AUI(...)' } ]
			},
			{
				code: nl('(function(){',
						'}(',
							'{x: 1},2,3',
						'));'),
				errors: [ { message: 'Args should each be on their own line (args on same line): <anonymous>(...)' } ]
			},
			{
				code: nl('alert({',
							'x: 1',
						'})(foo);'),
				errors: [ { message: 'Args should each be on their own line (args on start line): alert(...)' } ]
			},
			{
				code: nl('alert()(foo, {',
							'x: 1',
						'});'),
				errors: [ { message: 'Args should each be on their own line (args on same line): alert(...)' } ]
			},
			{
				code: nl('firstFn(arg1)(secondFn(arg2)(',
							'thirdFn(',
								'fourthFn(arg3)(',
									'fifthFn()',
								')',
							')',
						')',
					')'),
				errors: [ { message: 'Args should each be on their own line (args on start line): firstFn(...)' } ]
			},
			{
				code: nl('firstFn(arg1)(',
							'secondFn(arg2)(',
								'thirdFn(',
									'fourthFn(arg3)(',
										'fifthFn()',
									')',
								')',
						'))'),
				errors: [ { message: 'Args should each be on their own line (args on end line): firstFn(...)' } ]
			},
			{
				code: nl('firstFn(arg1)(',
							'secondFn(arg2)(',
								'thirdFn(',
									'fourthFn(',
										'{',
											'x: 1',
									'})(',
										'fifthFn()',
									')',
								')',
							')',
						')'),
				errors: [ { message: 'Args should each be on their own line (args on end line): fourthFn(...)' } ]
			},
			{
				code: nl('(function(arg1) {',
							'return function(){};',
						'})(obj, function(exp){',
					'});'),
				errors: [ { message: 'Args should each be on their own line (args on same line): <anonymous>(...)' } ]
			}
		]
	}
);