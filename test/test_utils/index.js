var _ = require('lodash');

var lintRules = require('../../lib/config/eslint').rules;

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

var invertValue = _.cond([[_.partial(_.eq, 0), _.constant(2)], [_.partial(_.eq, 2), _.constant(0)]]);

exports.getRule = function(ruleName, invert, obj) {
	var rule;

	var rules = obj || lintRules;

	if (_.isNumber(ruleName)) {
		ruleName = Object.keys(rules)[ruleName];
	}

	var retVal = _.pick(rules, ruleName);

	if (invert) {
		retVal[ruleName] = invertValue(retVal[ruleName]);
	}

	return retVal;
};