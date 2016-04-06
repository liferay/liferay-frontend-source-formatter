var base = require('../base');
var utils = require('../rule_utils');

module.exports = function(context) {
	var checkDistance = function(node) {
		var constants = utils.getConstants(node);

		constants.forEach(
			function(item, index, coll) {
				var prev = coll[index - 1];

				if (prev) {
					var diff = utils.getLineDistance(prev, item);

					if (diff < 2) {
						context.report(item, 'Constants should be separated by a single new line');
					}
				}
			}
		);
	};

	return {
		BlockStatement: checkDistance,
		Program: checkDistance
	};
};