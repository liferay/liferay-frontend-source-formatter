var A = require('./base').A;
var Formatter = require('./formatter_base');
var minimatch = require('minimatch');
var re = require('./re');

var matchOptions = {
	nocase: true,
	matchBase: true
};

Formatter.get = function(file) {
	var filePath = file.path;

	var registered = Formatter._registered;

	var formatter;

	Object.keys(registered).some(
		function(item, index) {
			var registeredItem = registered[item];

			var hasMatch = minimatch(filePath, registeredItem.extensions, matchOptions);

			if (hasMatch) {
				formatter = registeredItem;
			}

			return hasMatch;
		}
	);

	if (formatter) {
		formatter = new formatter(file);
	}

	return formatter;
};

require('./css');
require('./html');

module.exports = Formatter;