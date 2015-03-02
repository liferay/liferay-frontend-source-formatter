var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			"var a=10; alert(a);",
			"function b(a) { alert(a); }",
			"Object.hasOwnProperty.call(a);",
			"function a() { alert(arguments);}",
			{ code: "a(); function a() { alert(arguments); }", args: [1, {'nofunc': true}] },
			{ code: "function a() { alert(b); } function b() { alert(arguments); }", args: [1, {'samescope': true}] }
		],
		invalid: [
			{ code: "a++; var a=19;", errors: [{ message: "a was used before it was defined"}] },
			{ code: "a(); var a=function() {};", errors: [{ message: "a was used before it was defined"}] },
			{ code: "alert(a[1]); var a=[1,3];", errors: [{ message: "a was used before it was defined"}] },
			{ code: "a(); function a() { alert(b); var b=10; a(); }", errors: [{ message: "a was used before it was defined"}, { message: "b was used before it was defined"}] },
			{ code: "a(); var a=function() {};", args: [1, "nofunc"], errors: [{ message: "a was used before it was defined"}] }
		]
	}
);