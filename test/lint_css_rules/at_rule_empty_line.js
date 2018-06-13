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

var ruleName = rule.ruleName;

rule = rule.rule;

testRule(
	rule,
	{
		ruleName: ruleName,
		config: ['always', {except: ['first-nested']}],
		accept: [
			{
				code: `a {
					@include foo;
					color: pink;
				}`,
				description: 'always at rule empty line no first-nested'
			},
			{
				code: `
					@if $foo != null {
						div {
							color: blue;
						}
					}
					@else {
						div {
							color: red;
						}
					}
				`,
				description: 'ignore @else blocks'
			}
		],
		reject: [
			{
				code: `a {
					color: blue;
					@include foo;
				}`,
				message: stylelintRule.messages.expected
			}
		],
		syntax: 'scss',
	}
);

testRule(
	rule,
	{
		description: 'should handle invalid options',
		config: [],
		skipBasicChecks: true,
		reject: [
			{
				code: 'a {\n}',
				message: 'Expected option value for rule "' + ruleName + '"'
			}
		],
	}
);