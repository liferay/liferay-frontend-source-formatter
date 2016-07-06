var _ = require('lodash');
var cosmiconfig = require('cosmiconfig');

var CONFIG_DEFAULT = {
	_paths: {
		configs: [],
		keys: []
	}
};

var Config = function(obj) {
	this._config = this._normalize(obj);

	return this._config;
};

Config.prototype = {
	toJSON: function(){
		return _.omit(this._config, '_paths');
	},

	_get: function(key) {
		return key ? _.result(this._config, key) : this._config;
	},

	_normalize: function(obj) {
		var fn = this._get.bind(this);

		fn.toJSON = _.bindKey(this, 'toJSON');
		fn.toString = JSON.stringify.bind(JSON, fn);
		fn.inspect = fn.toString;

		return _.merge(fn, CONFIG_DEFAULT, obj);
	}
};

Config.load = function(cwd) {
	return cosmiconfig(
		'csf',
		{
			cwd: cwd,
			packageProp: 'csfConfig'
		}
	).then(
		function(obj) {
			var config = new Config(obj ? obj.config : {});

			config._paths.cwd = cwd;

			if (obj) {
				var STR_PATH = 'path:';

				var paths = Object.keys(config).reduce(
					function(prev, item, index) {
						if (item.indexOf(STR_PATH) === 0) {
							var pathKey = item.slice(STR_PATH.length);

							var pathConfig = config[item];

							prev.configs.push(pathConfig);

							delete config[item];

							prev.keys.push(pathKey);
						}

						return prev;
					},
					config._paths
				);

				paths.obj = obj;
			}

			return config;
		}
	).catch(
		function(err) {
			var config = new Config();

			config._paths.cwd = cwd;

			config._paths.err = err;

			return config;
		}
	);
};

module.exports = Config;