var _ = require('lodash');
var path = require('path');

require('./css');
require('./html');
require('./js');

var Formatter = module.exports = require('content-formatter');

var Config = require('./config');
var re = require('./re');

var RULES = require('./rules');

var minimatch = require('minimatch');

var configCache = {};

Formatter.prototype.config = function(key) {
	var abspath = this._abspath;

	if (!abspath) {
		abspath = path.resolve(this._config._paths.cwd, this.file);

		this._abspath = abspath;
	}

	var configObj = configCache[abspath];

	if (!configObj) {
		var config = this._config;

		var paths = config._paths;

		var configs = paths.configs;

		var filteredConfigs = _.reduce(
			paths.keys,
			(prev, item, index) => {
				if (minimatch(abspath, item)) {
					prev.push(configs[index]);
				}

				return prev;
			},
			[]
		);

		if (filteredConfigs.length) {
			filteredConfigs.unshift(new Config(), config);

			configObj = _.merge(...filteredConfigs);

			delete configObj._paths;
		}
		else {
			configObj = config;
		}

		configCache[abspath] = configObj;
	}

	return configObj(key);
};

Formatter.on(
	'init',
	instance => {
		instance._config = new Config();

		var ruleInstance = new re(RULES);

		instance._re = ruleInstance;

		instance.proxyEvent('message', ['re'], ruleInstance);

		instance.on(
			're:message',
			data => {
				instance.log(data.context.lineNum, data.message);
			}
		);
	}
);