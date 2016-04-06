var REGEX = require('../regex');

module.exports = function(context) {
	return {
		MemberExpression: function(node) {
			var propertyValue = node.property.value;
			var propertyType = node.property.type;

			if (propertyType === 'Literal' && !REGEX.STUBS.test(propertyValue)) {
				var dotNotation = require('../../node_modules/eslint/lib/rules/dot-notation');

				dotNotation(context).MemberExpression(node);
			}
		}
	};
};