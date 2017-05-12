var _ = require('lodash');
var getObject = require('getobject');

var REGEX = require('./regex');
var RULES = require('./rules');

var re = require('roolz');

re.prototype.hasExtraNewLines = function(item, index, collection) {
	var extraNewLines = false;

	if (item === '') {
		var length = collection.length;

		extraNewLines = (index === 0 && length > 1) || collection[index - 1] === '' || (index === length - 1 && length > 1);
	}

	if (extraNewLines) {
		this.emit(
			'message',
			{
				context: {
					rawContent: item,
					item,
					lineNum: index + 1
				},
				message: 'Extra new line'
			}
		);
	}

	return extraNewLines;
};

re.prototype.hasHex = item => {
	var match = item.match(REGEX.HEX);

	return match && match[0];
};

re.prototype.hasProperty = item => REGEX.PROPERTY.test(item);

module.exports = re;