var _ = require('lodash');
var utils = require('../rule_utils');

var sub = require('string-sub');

var REGEX_UNDERSCORE = /_/g;

module.exports = context => {

	// Recursive function for collecting identifiers from node

	var getIdentifiers = utils.getIdentifiers;

	var checkSort = node => {
		var constants = utils.getConstants(node);

		var prevConstants = [];

		constants.forEach(
			(item, index, coll) => {
				var prev = coll[index - 1];

				var itemName = item.id.name;

				if (prev) {
					var prevName = prev.id.name;

					var diff = utils.getLineDistance(prev, item);

					if (diff === 2 && prevName.replace(REGEX_UNDERSCORE, '') > itemName.replace(REGEX_UNDERSCORE, '')) {
						var identifiers = getIdentifiers(item.init);

						var hasReference = prevConstants.some(
							(item, index) => identifiers[item]
						);

						if (!hasReference) {
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