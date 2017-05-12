var _ = require('lodash');

var REGEX = require('../regex');

var sub = require('string-sub');

var isSingleLine = node => node.loc.start.line === node.loc.end.line;

module.exports = context => ({
	ArrayExpression(node) {
		var source = context.getSource(node);

		if (isSingleLine(node) && REGEX.ARRAY_SURROUNDING_SPACE.test(source)) {
			var brackets = [];
			var surroundingSpaceTypes = [];

			source.replace(
				REGEX.ARRAY_SURROUNDING_SPACE,
				(item, index, str) => {
					var endIndex = str.length;
					var startIndex = 0;

					var leadingSpace = item.indexOf('[') > -1;

					if (leadingSpace) {
						endIndex = index + 1;
						surroundingSpaceTypes.push('leading');
					}
					else {
						startIndex = index + 1;
						surroundingSpaceTypes.push('trailing');
						brackets.push('...');
					}

					brackets.push(str.substring(startIndex, endIndex));

					if (leadingSpace) {
						brackets.push('...');
					}
				}
			);

			brackets = _.uniq(brackets);

			var message = sub('Remove {0} spaces: {1}', surroundingSpaceTypes.join(' and '), brackets.join(' '));

			context.report(node, message);
		}
	}
});