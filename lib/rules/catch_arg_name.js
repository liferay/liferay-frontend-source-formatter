var base = require('../base');
var utils = require('../rule_utils');

module.exports = function(context) {
	return {
		CatchClause: function(node) {
			var paramName = node.param.name;

			if (paramName != 'e') {
				var message = base.sub('Catch statement param should be "e", not "{0}"', paramName);

				context.report(node, message);
			}
		}
	};
};