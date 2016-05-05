var _ = require('lodash');

exports.nl = function() {
	return _.toArray(arguments).join('\n');
}

exports.addES6 = function(config) {
	var parserOptions = _.merge({ ecmaVersion: 6 }, config);

	return function(item, index) {
		item.parserOptions = parserOptions;

		return item;
	};
};