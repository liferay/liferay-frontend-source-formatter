require('./css');
require('./html');
require('./js');

var _ = require('lodash');
var Formatter = module.exports = require('content-formatter');

var re = require('./re').constructor;

var REGEX = require('./regex');

Formatter.on(
	'init',
	function(instance) {
		var ruleInstance = new re(re.RULES);

		instance._re = ruleInstance;

		instance.proxyEvent('message', ['re'], ruleInstance);

		instance.on(
			're:message',
			function(data) {
				instance.log(data.context.lineNum, data.message);
			}
		);
	}
);