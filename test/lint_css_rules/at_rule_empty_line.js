var path = require('path');
var ruleUtils = require('../../lib/rule_utils');
var testRule = require('../stylelint_rule_tester');

var stylelint = testRule.stylelint;

var rule = require('../../lib/lint_css_rules/' + path.basename(__filename));
var sub = require('string-sub');

var stylelintRule = require('stylelint/lib/rules/at-rule-empty-line-before');

var path = require('path');
var fs = require('fs');
var chai = require('chai');
var _ = require('lodash');

chai.use(require('chai-string'));

var assert = chai.assert;

testRule(
	rule,
	{
		ruleName: rule.ruleName,
		config: ['always', {except: ['first-nested']}],
		accept: [
			{
				code: 'a {\n  @include foo;\n  color: pink;\n}',
				description: 'always at rule empty line no first-nested'
			}
		],
		reject: [
			{
				code: 'a {\n color: blue;\n @include foo;\n}',
				message: stylelintRule.messages.expected
			}
		],
		syntax: 'scss',
	}
);