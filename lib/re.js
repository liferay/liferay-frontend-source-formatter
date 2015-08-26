var _ = require('lodash');
var getObject = require('getobject');

var REGEX = require('./regex');
var RULES = require('./rules');

var re = require('roolz');

re.prototype.hasExtraNewLines = function(item, index, collection) {
	var extraNewLines = false;

	if (item === '') {
		extraNewLines = (index === 0 && collection.length > 1) || collection[index - 1] === '';
	}

	if (extraNewLines) {
		this.emit(
			'message',
			{
				context: {
					rawContent: item,
					item: item,
					lineNum: index + 1
				},
				message: 'Extra new line'
			}
		);
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

module.exports = re;