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

		_.assign(ruleInstance, REGEX);

		instance._re = ruleInstance;

		instance.proxyEvent('message', ruleInstance);
	}
);