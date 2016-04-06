var base = require('../base');

var sub = require('string-sub');

module.exports = function(context) {
	return {
		VariableDeclaration: function(node) {
			var declarations = node.declarations;

			if (declarations.length > 1) {
				var vars = declarations.map(
					function(item, index) {
						return item.id.name;
					}
				);

				var message = sub('Each variable should have it\'s own var statement: {0}', vars.join(', '));

				context.report(node, message);
			}
		}
	};
};