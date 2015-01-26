module.exports = function(context) {
	return {
		EmptyStatement: function(node) {
			var afterText = context.getSource(node, 0, 10);

			if (afterText !== ';(function(') {
				context.report(node, 'Unnecessary semicolon.');
			}
		}
	};
};