var eslint = require('eslint');
var ESLINT_CONFIG = require('./eslint_config');

var base = require('./base');

var A = A;
var trackErr = base.trackErr;
var sub = base.sub;

var esLintFormatter = function(results, config) {
	results.forEach(
		function(result, index) {
			result.messages.forEach(
				function(item, index) {
					trackErr(sub('Line: {0} {1} ({2})', (item.line || 0), item.message, (item.ruleId || 'n/a')).warn, result.filePath, (item.ruleId || item.message));
				}
			);
		}
	);
};

var customRules = {
	'csf-no-extra-semi': function(context) {
		return {
			EmptyStatement: function(node) {
				var afterText = context.getSource(node, 0, 10);

				if (afterText !== ';(function(') {
					context.report(node, 'Unnecessary semicolon.');
				}
			}
		};
	},
	'csf-sort-requires': function(context) {
		return {
			Property: function(node) {
				var nodeValue = node.value;

				if (node.key.name == 'requires' && nodeValue.type == 'ArrayExpression') {
					var elements = nodeValue.elements;

					if (elements.length > 1) {
						// I really, really hate having two loops here,
						// but I can't think of any way to check only strings
						// in an array, allowing for the off chance of non-string values
						// ie. if the previous N items are not strings, you'll have to loop
						// backwards anyways, but I would like to find a way to do
						// this check all in one iteration

						var modules = [];

						elements.forEach(
							function(item, index) {
								if (item.type == 'Literal' && typeof item.value === 'string') {
									modules.push(item.value);
								}
							}
						);

						var needsSort = [];

						modules.forEach(
							function(item, index, collection) {
								if (index > 0) {
									var prevValue = collection[index - 1];

									if (item < prevValue) {
										needsSort.push(prevValue + ' > ' + item);
									}
								}
							}
						);

						if (needsSort.length) {
							context.report(node, 'Sort modules in "requires" array: ' + needsSort.join(', '));
						}
					}
				}
			}
		};
	}
};

module.exports = function(contents, file) {
	eslint.linter.defineRules(customRules);

	var results = [{filePath: file, messages: eslint.linter.verify(contents, ESLINT_CONFIG, file)}];

	esLintFormatter(results, ESLINT_CONFIG);
};