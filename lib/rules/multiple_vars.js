var base = require('../base');

module.exports = function(context) {
	return {
		VariableDeclaration: function(node) {
			var declarations = node.declarations;

			if (declarations.length > 1) {
				var lines = [];
				var low = declarations[0].loc.start.line;
				var high = low;

				var vars = declarations.map(
					function(item, index) {
						var line = item.loc.start.line;

						if (line > high) {
							high = line;
						}
						else if (line < low) {
							low = line;
						}

						return item.id.name;
					}
				);

				lines.push(low);

				if (low !== high) {
					lines.push(high);
				}

				var message = base.sub('Each variable should have it\'s own var statement: {0}', vars.join(', '));

				context.report(node, message);
			}
		}
	};
};