var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'try{}catch(e){\n}'
		],

		invalid: [
			{
				code: 'try{}catch(e){}',
				errors: [ { message: 'Empty catch statement should be closed on line 2' } ]
			}
		]
	}
);