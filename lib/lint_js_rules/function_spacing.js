var utils = require('../rule_utils');

var sub = require('string-sub');

module.exports = {
	create: function(context) {
		var testFunctionSpacing = function(node) {
			var nodeBody = node.body;
			var fnBody = nodeBody.body;

			var range = [];

			var sourceCode = context.getSourceCode();

			function fix(fixer) {
				return fixer.replaceTextRange(range, '\n');
			}

			if (fnBody.length) {
				var firstStatement = fnBody[0];
				var lastStatement = fnBody[fnBody.length - 1];

				var startLineDistance = utils.getLineDistance(nodeBody, firstStatement, 'start');

				if (startLineDistance !== 1) {
					range[0] = sourceCode.getFirstToken(nodeBody).range[1];
					range[1] = sourceCode.getFirstToken(firstStatement).range[0] - 1;

					context.report(
						{
							node: node,
							message: sub('There should be exactly one line between the start of the function and the first statement, not {0} lines', startLineDistance),
							fix: fix
						}
					);
				}

				var endLineDistance = utils.getLineDistance(lastStatement, nodeBody, 'end', 'end');

				if (endLineDistance !== 1) {
					range[0] = sourceCode.getLastToken(lastStatement).range[1];
					range[1] = sourceCode.getLastToken(nodeBody).range[0];

					context.report(
						{
							node: lastStatement,
							message: sub('There should be exactly one line between the last statement and the end of the function, not {0} lines', endLineDistance),
							fix: fix
						}
					);
				}
			}
		};

		return {
			FunctionExpression: testFunctionSpacing,
			FunctionDeclaration: testFunctionSpacing
		};
	},

	meta: {
		fixable: 'whitespace'
	}
};