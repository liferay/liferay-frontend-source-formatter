'use strict';

var _ = require('lodash');
var cosmiconfig = require('cosmiconfig');

var CONFIG_DEFAULT = {
	_paths: {
		configs: [],
		keys: []
	}
};

class Config {
	constructor(obj) {
		this._config = this._normalize(obj);

		return this._config;
	}

	toJSON() {
		return _.omit(this._config, '_paths');
	}

	_get(key) {
		return key ? _.result(this._config, key) : this._config;
	}

	_normalize(obj) {
		const fn = this._get.bind(this);

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
}

class Loader {
	constructor(options) {
		options = _.defaults(
			options,
			{
				cwd: process.cwd(),
				packageProp: 'csfConfig'
			}
		);

		this._config = cosmiconfig('csf', options);
	}

	load(cwd) {
		return this._config.search(cwd).then(
			obj => {
				const config = new Config(obj ? obj.config : {});

				config._paths.cwd = cwd;

				if (obj) {
					const STR_PATH = 'path:';

					const paths = Object.keys(config).reduce(
						(prev, item, index) => {
							if (item.indexOf(STR_PATH) === 0) {
								const pathKey = item.slice(STR_PATH.length);

								const pathConfig = config[item];

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
			err => {
				const config = new Config();

				config._paths.cwd = cwd;

				config._paths.err = err;

				return config;
			}
		);
	}
}

Config.Loader = Loader;

module.exports = Config;