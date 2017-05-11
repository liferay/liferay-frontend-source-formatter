var chai = require('chai');
var path = require('path');

var Config = require('../lib/config');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Formatter',
	function() {
		'use strict';

		var logger = new Logger.constructor();

		it(
			'should have a config object',
			function() {
				var formatter = Formatter.get('foo.css', logger, {});

				assert.isTrue(typeof formatter._config === 'function');
				assert.isObject(formatter._config._paths);
			}
		);

		it(
			'should get merged config by path',
			function() {
				var cwd = path.join(__dirname, 'fixture/config/path_configs');

				return (new Config.Loader).load(cwd).then(
					function(config) {
						var formatter = Formatter.get('foo.css', logger, {quiet: true});

						formatter._config = config;

						assert.isFalse(formatter.config('flags.quiet'));
					}
				);
			}
		);
	}
);