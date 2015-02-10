var base = require('../base');
var utils = require('../rule_utils');

module.exports = function(context) {
	return {
		BlockStatement: function(node) {
			var constants = utils.getConstants(node);

			var prevConstants = [];

			constants.forEach(
				function(item, index, coll) {
					var prev = coll[index - 1];

					var itemName = item.id.name;

					if (prev) {
						var prevName = prev.id.name;

						var diff = utils.getLineDistance(prev, item);

						if (diff === 2 && prevName > itemName) {
							var re = new RegExp('\\b' + prevConstants.join('|') + '\\b');

							if (!re.test(context.getSource(item))) {
								var message = base.sub('Sort constants: {0} {1}', prevName, itemName);

								context.report(node, message);
							}
						}
					}

					prevConstants.push(itemName);
				}
			);
		}
	};
};