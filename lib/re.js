var _ = require('lodash');
var getObject = require('getobject');

var REGEX = require('./regex');
var RULES = require('./rules');

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
	var match = item.match(REGEX.HEX);

	return match && match[0];
};

re.prototype.hasProperty = function(item) {
	return REGEX.PROPERTY.test(item);
};

var rulesInstance = new re(RULES);

rulesInstance.re = re;

re.RULES = RULES;

module.exports = rulesInstance;