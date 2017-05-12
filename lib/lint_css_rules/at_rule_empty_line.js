var _ = require('lodash');
var stylelint = require('stylelint');
var sub = require('string-sub');

var REGEX_NEWLINE = require('../regex').NEWLINE;

var ruleUtils = require('../rule_utils');

var ruleName = ruleUtils.getRuleId(__filename);

var slUtils = stylelint.utils;
/* istanbul ignore next */
var jsonf = _.bindKeyRight(
	JSON,
	'stringify',
	(key, value) => {
		if (key === 'start' || key === 'end') {
			return value.line;
		}
		if (['parent', 'range'].indexOf(key) === -1) {
			return value;
		}
	},
	4
);

module.exports = (expectation, options) => {
	var atRuleFn = stylelint.rules['at-rule-empty-line-before'](expectation, options);

	return (root, result) => {
		var messages = slUtils.ruleMessages(
			ruleName,
			{
				expected: 'Expected a newline {0} at-rule',
				rejected: 'Unexpected newline {0} at-rule'
			}
		);

		var validOptions = slUtils.validateOptions(
			result,
			ruleName,
			{
				actual: expectation,
				possible: ['always', 'never']
			},
			{
				actual: options,
				possible: {
					except: ['first-nested'],
					ignore: ['between-nested']
				},
				optional: true
			}
		);

		var getLineDistance = (left, right) => right.source.start.line - left.source.end.line;

		var isSingleLineRule = node => node.source.start.line === node.source.end.line;

		var validLines = [];

		if (validOptions) {
			var otherResults = atRuleFn(root, result);

			root.walkAtRules(
				node => {
					if (node !== root.first) {
						var startLine = node.source.start.line;

						if (node.name === 'include' || node.name === 'import') {
							var prev = node.prev();
							var next = node.next();

							if (prev && prev.type === 'atrule' && isSingleLineRule(node) && isSingleLineRule(prev) && getLineDistance(prev, node) === 1) {
								validLines.push(startLine);
							}
						}
						else if (node.name === 'else') {
							validLines.push(startLine);
						}
					}
				}
			);
		}

		result.messages = _.reject(
			result.messages,
			(item, index) => item.rule === 'at-rule-empty-line-before' && _.includes(validLines, item.line)
		);

		return result;
	};
};

module.exports.ruleName = ruleName;