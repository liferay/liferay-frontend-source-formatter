module.exports = function(context) {
	return {
		MemberExpression: function(node) {
			var propertyValue = node.property.value;
			var propertyType = node.property.type;

			if (propertyType === 'Literal' && !RE_STUBS.test(propertyValue)) {
				var dotNotation = require('../node_modules/eslint/lib/rules/dot-notation');

				dotNotation(context).MemberExpression(node);
			}
		}
	};
};