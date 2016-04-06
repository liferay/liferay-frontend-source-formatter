var base = require('../base');

var sub = require('string-sub');

module.exports = function(context) {
	return {
		CatchClause: function(node) {
			var paramName = node.param.name;

			if (paramName != 'e') {
				var message = sub('Catch statement param should be "e", not "{0}"', paramName);

				context.report(node, message);
			}
		}
	};
};