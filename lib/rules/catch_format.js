var base = require('../base');
var utils = require('../rule_utils');

module.exports = function(context) {
	return {
		CatchClause: function(node) {
			var start = node.loc.start.line;
			var shouldEnd = start + 1;
			var end = node.loc.end.line;

			if (!node.body.body.length && end != shouldEnd) {
				var message = base.sub('Empty catch statement should be closed on line {0}', shouldEnd);

				context.report(node, message);
			}
		}
	};
};