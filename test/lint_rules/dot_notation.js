var _ = require('lodash');
var path = require('path');
var base = require('../../lib/base.js');

var lint = require('../../lib/lint');

var linter = lint.linter;
var ESLintTester = require('eslint-tester');
var eslintTester = new ESLintTester(linter);

var validRules = [
	'document["some-prop"];'
];

_.forEach(
	base.stubs,
	function(item, index) {
		validRules.push('document["' + index + '"];');
	}
);

eslintTester.addRuleTest(
	path.resolve(__dirname, '../', '../', 'lib/lint_rules/' + path.basename(__filename)),
	{
		valid: validRules,

		invalid: [
			{
				code: 'document["test"]',
				errors: [ { message: '["test"] is better written in dot notation.' } ]
			}
		]
	}
);