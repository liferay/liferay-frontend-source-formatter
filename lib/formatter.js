require('./css');
require('./html');
require('./js');

var Formatter = module.exports = require('content-formatter');

var re = require('./re');

var RULES = require('./rules');

Formatter.on(
	'init',
	function(instance) {
		var ruleInstance = new re(RULES);

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