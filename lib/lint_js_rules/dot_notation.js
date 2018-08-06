var REGEX = require('../regex');

var dotNotation = require('eslint/lib/rules/dot-notation');

var customDotNotation = context => ({
	MemberExpression(node) {
		var propertyType = node.property.type;
		var propertyValue = node.property.value;

		if (propertyType === 'Literal' && !REGEX.STUBS.test(propertyValue)) {
			dotNotation.create(context).MemberExpression(node);
		}
	}
});

Object.assign(customDotNotation, dotNotation);

module.exports = customDotNotation;