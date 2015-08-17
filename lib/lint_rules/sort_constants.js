var base = require('../base');
var utils = require('../rule_utils');

var sub = require('string-sub');

var REGEX_UNDERSCORE = /_/g;

module.exports = function(context) {
	var checkSort = function(node) {
		var constants = utils.getConstants(node);

		var prevConstants = [];

		constants.forEach(
			function(item, index, coll) {
				var prev = coll[index - 1];

				var itemName = item.id.name;

				if (prev) {
					var prevName = prev.id.name;

					var diff = utils.getLineDistance(prev, item);

					if (diff === 2 && prevName.replace(REGEX_UNDERSCORE, '') > itemName.replace(REGEX_UNDERSCORE, '')) {
						var re = new RegExp('\\b' + prevConstants.join('|') + '\\b');

						if (!re.test(context.getSource(item))) {
							var message = sub('Sort constants: {0} {1}', prevName, itemName);

							context.report(prev, message);
						}
					}
				}

				prevConstants.push(itemName);
			}
		);
	};

	return {
		BlockStatement: checkSort,
		Program: checkSort
	};
};