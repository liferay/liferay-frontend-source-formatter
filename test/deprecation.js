var path = require('path');
var fs = require('fs');
var chai = require('chai');
var _ = require('lodash');

var deprecationCheck = require('../lib/deprecation');

chai.use(require('chai-string'));

var assert = chai.assert;

var INTERVAL = deprecationCheck.INTERVAL;

var configStore = {
	get(key) {
		return this[key];
	},

	set(key, value) {
		this[key] = value;
	}
};

var expectedMessage = `-----------------------------------------------------------
  Using the check_sf form of this module is deprecated.
  Please use the csf command instead. It's easier to type too!`;

describe(
	'deprecation checking',
	function () {
		'use strict';

		it(
			'should return a deprecation message',
			function() {
				var config = Object.create(configStore);

				config.set('lastDeprecationCheck', Date.now() - INTERVAL);

				var message = deprecationCheck(
					{
						config,
						scriptName: 'check_sf'
					}
				);

				assert.isString(message);
				assert.isAbove(message.length, 0);
				assert.equal(message, expectedMessage);
			}
		);

		it(
			'should not return a deprecation message',
			function() {
				var config = Object.create(configStore);

				config.set('lastDeprecationCheck', Date.now());

				var message = deprecationCheck(
					{
						config,
						scriptName: 'check_sf'
					}
				);

				assert.isString(message);
				assert.equal(message.length, 0);
			}
		);
	}
);