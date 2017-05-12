var REGEX = require('../regex');

module.exports = context => ({
	MemberExpression(node) {
		var propertyType = node.property.type;
		var propertyValue = node.property.value;

		if (propertyType === 'Literal' && !REGEX.STUBS.test(propertyValue)) {
			var dotNotation = require('eslint/lib/rules/dot-notation');

			dotNotation.create(context).MemberExpression(node);
		}
	}
});