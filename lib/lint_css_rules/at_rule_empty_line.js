var _ = require('lodash');
var stylelint = require('stylelint');
var sub = require('string-sub');

var REGEX_NEWLINE = require('../regex').NEWLINE;

var ruleUtils = require('../rule_utils');

var slUtils = stylelint.utils;
/* istanbul ignore next */
var jsonf = _.bindKeyRight(
	JSON,
	'stringify',
	function(key, value) {
		if (key === 'start' || key === 'end') {
			return value.line;
		}
		if (['parent', 'range'].indexOf(key) === -1) {
			return value;
		}
	},
	4
);

module.exports = function(expectation, options) {
	var atRuleFn = stylelint.rules['at-rule-empty-line-before'](expectation, options);

	return function(root, result) {
		var otherResults = atRuleFn(root, result);
		var ruleName = ruleUtils.getRuleId(__filename);

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

		if (!validOptions) {
			return;
		}

		var isSingleLineRule = function(node) {
			return node.source.start.line === node.source.end.line;
		};

		// var get

		// console.log(result);

		var validLines = [];

		root.walkAtRules(
			function(node) {
				if (node.first !== root.first) {
					if (node.name === 'include' || node.name === 'import') {
						if (/*node.source.start.line === node.source.end.line && */node.prev()) {
							// console.log(jsonf(node));
						}

						var prev = node.prev();
						var next = node.next();

						// if (prev && prev.type === 'decl' && node.source.start.line - prev.source.end.line === 1) {
						// 	// node.raws.before = '\n' + node.raws.before;
						// }
						// else if (!prev && node.raws.before.split(REGEX_NEWLINE).length > 1) {

						// }

						if (prev && prev.type === 'atrule' && isSingleLineRule(node) && isSingleLineRule(prev) && node.source.start.line - prev.source.end.line === 1) {
							validLines.push(node.source.start.line);
						}

						// if (next && next.type === 'decl' && next.source.start.line - node.source.end.line < 2) {
						// 	// next.raws.before = '\n' + next.raws.before;
						// }
						// else if (!next && node.raws.after.split(REGEX_NEWLINE).length > 1) {

						// }
					}
				}
			}
		);

		result.messages = _.reject(
			result.messages,
			function(item, index) {
				return item.rule === 'at-rule-empty-line-before' && _.includes(validLines, item.line);
			}
		);

		// console.log(foo);

		return otherResults;
	};
};

// exports.default = function (expectation, options) {
// 	return function (root, result) {
// 		var validOptions = (0, _utils.validateOptions)(result, ruleName, {
// 			actual: expectation,
// 			possible: ["always", "never"]
// 		}, {
// 			actual: options,
// 			possible: {
// 				except: ["blockless-group", "first-nested", "all-nested"],
// 				ignore: ["after-comment", "all-nested"]
// 			},
// 			optional: true
// 		});
// 		if (!validOptions) {
// 			return;
// 		}

// 		root.walkAtRules(function (atRule) {

// 			// Ignore the first node
// 			if (atRule === root.first) {
// 				return;
// 			}

// 			var isNested = atRule.parent !== root;
// 			if ((0, _utils.optionsHaveIgnored)(options, "all-nested") && isNested) {
// 				return;
// 			}

// 			// Optionally ignore the expectation if a comment precedes this node
// 			if ((0, _utils.optionsHaveIgnored)(options, "after-comment") && atRule.prev() && atRule.prev().type === "comment") {
// 				return;
// 			}

// 			var before = atRule.raw("before");
// 			var emptyLineBefore = before && (before.indexOf("\n\n") !== -1 || before.indexOf("\r\n\r\n") !== -1 || before.indexOf("\n\r\n") !== -1);

// 			var expectEmptyLineBefore = expectation === "always" ? true : false;

// 			var previousNode = atRule.prev();

// 			// Reverse the expectation if any exceptions apply
// 			if ((0, _utils.optionsHaveException)(options, "all-nested") && isNested || getsFirstNestedException() || getsBlocklessGroupException()) {
// 				expectEmptyLineBefore = !expectEmptyLineBefore;
// 			}

// 			// Return if the exceptation is met
// 			if (expectEmptyLineBefore === emptyLineBefore) {
// 				return;
// 			}

// 			var message = expectEmptyLineBefore ? messages.expected : messages.rejected;

// 			(0, _utils.report)({
// 				message: message,
// 				node: atRule,
// 				result: result,
// 				ruleName: ruleName
// 			});

// 			function getsBlocklessGroupException() {
// 				return (0, _utils.optionsHaveException)(options, "blockless-group") && previousNode && previousNode.type === "atrule" && !(0, _utils.cssStatementHasBlock)(previousNode) && !(0, _utils.cssStatementHasBlock)(atRule);
// 			}

// 			function getsFirstNestedException() {
// 				return (0, _utils.optionsHaveException)(options, "first-nested") && isNested && atRule === atRule.parent.first;
// 			}
// 		});
// 	};
// };

// var _utils = require("../../utils");

// var ruleName = exports.ruleName = "at-rule-empty-line-before";

// var messages = exports.messages = (0, _utils.ruleMessages)(ruleName, {
// 	expected: "Expected empty line before at-rule",
// 	rejected: "Unexpected empty line before at-rule"
// });