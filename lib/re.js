var _ = require('lodash');
var getObject = require('getobject');

var REGEX = require('./regex');

var RULES = {
	common: require('./engine_rules/common'),
	css: require('./engine_rules/css'),

	html: require('./engine_rules/html'),

	htmlJS: require('./engine_rules/html_js'),
	js: require('./engine_rules/js')
};

var re = require('./re_base');

re.prototype.hasExtraNewLines = function(item, index, collection, logger) {
	var extraNewLines = false;

	if (item === '') {
		extraNewLines = (index === 0 && collection.length > 1) || collection[index - 1] === '';
	}

	if (extraNewLines && logger) {
		logger(index + 1, 'Extra new line');
	}

	return extraNewLines;
};

re.prototype.hasHex = function(item) {
	var match = item.match(this.REGEX_HEX);

	return match && match[0];
};

re.prototype.hasProperty = function(item) {
	return this.REGEX_PROPERTY.test(item);
};

var rulesInstance = new re(RULES);

_.assign(rulesInstance, REGEX);

rulesInstance.re = re;

re.RULES = RULES;

module.exports = rulesInstance;