var path = require('path');

var lint = require('../../lib/lint');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_rules/' + path.basename(__filename)),
	{
		valid: [
			'try{}catch(e){}'
		],

		invalid: [
			{
				code: 'try{}catch(err){}',
				errors: [ { message: 'Catch statement param should be "e", not "err"' } ]
			}
		]
	}
);