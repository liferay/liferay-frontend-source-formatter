var chai = require('chai');

var Config = require('../lib/config');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Config',
	function() {
		'use strict';

		it(
			'should be a function',
			function() {
				assert.isTrue(typeof new Config() === 'function');
			}
		);

		it(
			'should exclude _paths property when logging',
			function() {
				var config = new Config();

				assert.isTrue(JSON.stringify(config) === '{}', 'Should be an empty object {}');
				assert.isTrue(typeof config._paths === 'object', '_paths should still exists in config');
			}
		);

		it(
			'should return property by key',
			function() {
				var config = new Config(
					{
						foo: 1,
						bar: function() {
							return 'hello world';
						}
					}
				);

				assert.isTrue(config('foo') === 1);
				assert.isTrue(config('bar') === 'hello world');
			}
		);

		it(
			'should return entire config when called without a key',
			function() {
				var config = new Config(
					{
						foo: 1,
						bar: function() {
							return 'hello world';
						}
					}
				);

				assert.isTrue(config() === config);
			}
		);
	}
);