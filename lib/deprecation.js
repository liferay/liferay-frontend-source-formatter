var _ = require('lodash');
var colors = require('cli-color-keywords')();
var path = require('path');

var unindent = (strings, ...keys) => _.zipWith(strings, keys, _.add).join('').replace(/^\s+/gm, '  ');

function deprecationCheck(params) {
	var config = params.config;
	var scriptName = params.scriptName;

	var checkInterval = params.interval || deprecationCheck.INTERVAL;

	var lastDeprecationCheck = config.get('lastDeprecationCheck');

	var retVal = '';

	if (path.basename(scriptName) === 'check_sf' && (Date.now() - lastDeprecationCheck >= checkInterval)) {
		var header = `Using the ${colors.inverse('check_sf')} form of this module is deprecated.`;

		var footer = `Please use the ${colors.inverse('csf')} command instead. It's easier to type too!`;

		var maxLineLength = Math.max(header.length, footer.length);

		var bar = new Array(maxLineLength).join('-');

		config.set('lastDeprecationCheck', Date.now());

		retVal = unindent`${bar}
			${colors.error(header)}
			${colors.green(footer)}`;
	}

	return retVal;
}

deprecationCheck.INTERVAL = 1000 * 60 * 60 * 24;

module.exports = deprecationCheck;