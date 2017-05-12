var utils = require('../rule_utils');

var sub = require('string-sub');

module.exports = {
	create(context) {
		var testFunctionSpacing = node => {
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

				var leadingComments = sourceCode.getComments(firstStatement).leading;
				var trailingComments = sourceCode.getComments(lastStatement).trailing;

				var startLineDistance = utils.getLineDistance(nodeBody, firstStatement, 'start');

				if (leadingComments.length) {
					var firstLeadingComment = leadingComments[0];
					var lastLeadingComment = leadingComments[leadingComments.length - 1];

					var startCommentAfterDistance = utils.getLineDistance(lastLeadingComment, firstStatement, 'start');
					var startCommentBeforeDistance = utils.getLineDistance(nodeBody, firstLeadingComment, 'start');

					startLineDistance = Math.max(startCommentBeforeDistance, startCommentAfterDistance);
				}

				if (startLineDistance !== 1) {
					range[0] = sourceCode.getFirstToken(nodeBody).range[1];
					range[1] = sourceCode.getFirstToken(firstStatement).range[0] - 1;

					context.report(
						{
							fix,
							message: sub('There should be exactly one line between the start of the function and the first statement, not {0} lines', startLineDistance),
							node
						}
					);
				}

				var endLineDistance = utils.getLineDistance(lastStatement, nodeBody, 'end', 'end');

				if (trailingComments.length) {
					var firstTrailingComment = trailingComments[0];
					var lastTrailingComment = trailingComments[trailingComments.length - 1];

					var endCommentAfterDistance = utils.getLineDistance(lastTrailingComment, nodeBody, 'end', 'end');
					var endCommentBeforeDistance = utils.getLineDistance(lastStatement, firstTrailingComment, 'end', 'end');

					endLineDistance = Math.max(endCommentBeforeDistance, endCommentAfterDistance);
				}

				if (endLineDistance !== 1) {
					range[0] = sourceCode.getLastToken(lastStatement).range[1];
					range[1] = sourceCode.getLastToken(nodeBody).range[0];

					context.report(
						{
							fix,
							message: sub('There should be exactly one line between the last statement and the end of the function, not {0} lines', endLineDistance),
							node: lastStatement
						}
					);
				}
			}
		};

		return {
			FunctionDeclaration: testFunctionSpacing,
			FunctionExpression: testFunctionSpacing
		};
	},

	meta: {
		fixable: 'whitespace'
	}
};