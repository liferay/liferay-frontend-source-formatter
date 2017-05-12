var sub = require('string-sub');

module.exports = context => ({
	CatchClause(node) {
		var end = node.loc.end.line;
		var start = node.loc.start.line;

		var shouldEnd = start + 1;

		if (!node.body.body.length && end != shouldEnd) {
			var message = sub('Empty catch statement should be closed on line {0}', shouldEnd);

			context.report(node, message);
		}
	}
});