var _ = require('lodash');
var stylelint = require('stylelint');

var ruleUtils = require('../rule_utils');

var ruleName = ruleUtils.getPluginId(__filename);

var slUtils = stylelint.utils;

/* istanbul ignore next */
var jsonf = _.bindKeyRight(
	JSON,
	'stringify',
	(key, value) => {
		var retVal;

		if (key === 'start' || key === 'end') {
			retVal = value.line;
		}
		else if (['parent', 'range'].indexOf(key) === -1) {
			retVal = value;
		}

		return retVal;
	},
	4
);

var plugin = stylelint.createPlugin(
	ruleName,
	(options, secondaryOptions) => {
		// var atRuleFn = stylelint.rules['at-rule-empty-line-before'](expectation, options, context || {});

		return (root, result) => {
			var validOptions = slUtils.validateOptions(
				result,
				ruleName,
				{
					actual: options,
					possible: ['always', 'never']
				},
				{
					actual: secondaryOptions,
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
				root.walkAtRules(
					node => {
						if (node !== root.first) {
							var startLine = node.source.start.line;

							if (node.name === 'include' || node.name === 'import') {
								var prev = node.prev();

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

				stylelint.utils.checkAgainstRule(
					{
						ruleName: 'at-rule-empty-line-before',
						ruleSettings: [options, secondaryOptions],
						root: root
					},
					(warning) => {
						if (!_.includes(validLines, warning.line)) {
							stylelint.utils.report(
								{
									message: warning.text,
									ruleName: ruleName,
									result: result,
									node: warning.node,
									line: warning.line,
									column: warning.column,
								}
							);
						}
					}
				);
			}

			return result;
		};
	}
);

plugin.ruleName = ruleName;

module.exports = plugin;