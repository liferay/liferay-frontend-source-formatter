var Formatter = require('./formatter_base');
var minimatch = require('minimatch');

var matchOptions = {
	matchBase: true,
	nocase: true
};

Formatter.get = function(file, logger, flags) {
	var filePath = file;

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
		formatter = new formatter(file, logger, flags);
	}

	return formatter;
};

require('./css');
require('./html');
require('./js');

module.exports = Formatter;