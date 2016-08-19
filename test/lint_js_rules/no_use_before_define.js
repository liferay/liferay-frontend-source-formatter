var path = require('path');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			{ code: "function a() { alert(b); } var b = 1;", options: [{'samescope': true}] }
		],
		invalid: [
			{ code: "function a() { alert(b); } var b = 1;", options: [{'samescope': false}], errors: [{ message: "'b' was used before it was defined.", type: "Identifier" }] },
			{ code: "function a() { alert(b); } var b = 1;", options: ['nofunc'], errors: [{ message: "'b' was used before it was defined.", type: "Identifier" }] },
			{ code: "function a() { alert(b); var b = 1; }", options: [{'samescope': true}], errors: [{ message: "'b' was used before it was defined.", type: "Identifier" }] }
		]
	}
);