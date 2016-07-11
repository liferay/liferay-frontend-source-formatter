var utils = require('../rule_utils');

var sub = require('string-sub');

module.exports = function(context) {
	var testFunctionSpacing = function(node) {
		var nodeBody = node.body;
		var fnBody = nodeBody.body;

		if (fnBody.length) {
			var firstStatement = fnBody[0];
			var lastStatement = fnBody[fnBody.length - 1];

			var startLineDistance = utils.getLineDistance(nodeBody, firstStatement, 'start');

			if (startLineDistance !== 1) {
				context.report(node, sub('There should be exactly one line between the start of the function and the first statement, not {0} lines', startLineDistance));
			}

			var endLineDistance = utils.getLineDistance(lastStatement, nodeBody, 'end', 'end');

			if (endLineDistance !== 1) {
				context.report(lastStatement, sub('There should be exactly one line between the last statement and the end of the function, not {0} lines', endLineDistance));
			}
		}
	};

	return {
		FunctionExpression: testFunctionSpacing,
		FunctionDeclaration: testFunctionSpacing
	};
};