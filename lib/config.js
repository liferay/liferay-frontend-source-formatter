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

		Object.defineProperty(
			fn,
			'toJSON',
			{
				enumerable: false,
				value: _.bindKey(this, 'toJSON')
			}
		);

		Object.defineProperty(
			fn,
			'toString',
			{
				enumerable: false,
				value: JSON.stringify.bind(JSON, fn)
			}
		);

		Object.defineProperty(
			fn,
			'inspect',
			{
				enumerable: false,
				value: fn.toString
			}
		);

		Object.defineProperty(
			fn,
			'_paths',
			{
				enumerable: false,
				value: {}
			}
		);

		return _.merge(fn, CONFIG_DEFAULT, obj);
	}
};

var Loader = function(options) {
	options = _.defaults(
		options,
		{
			cwd: process.cwd(),
			packageProp: 'csfConfig'
		}
	);

	this._config = cosmiconfig('csf', options);
}

Loader.prototype = {
	load: function(cwd) {
		return this._config.load(cwd).then(
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
	}
};

Config.Loader = Loader;

module.exports = Config;