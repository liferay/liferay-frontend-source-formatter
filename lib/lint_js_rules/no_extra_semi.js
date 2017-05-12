module.exports = context => ({
	EmptyStatement(node) {
		var afterText = context.getSource(node, 0, 10);

		if (afterText !== ';(function(') {
			context.report(node, 'Unnecessary semicolon.');
		}
	}
});