var sub = require('string-sub');

module.exports = context => ({
	CatchClause(node) {
		var paramName = node.param.name;

		if (paramName != 'e') {
			var message = sub('Catch statement param should be "e", not "{0}"', paramName);

			context.report(node, message);
		}
	}
});