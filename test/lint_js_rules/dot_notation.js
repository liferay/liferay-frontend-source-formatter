var _ = require('lodash');
var path = require('path');
var base = require('../../lib/base.js');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var validRules = [
	'document["some-prop"];'
];

_.forEach(
	base.stubs,
	function(item, index) {
		validRules.push('document["' + index + '"];');
	}
);

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
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