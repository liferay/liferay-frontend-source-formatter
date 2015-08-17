var chai = require('chai');
var path = require('path');

var Logger = require('../lib/logger');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Logger',
	function() {
		it(
			'should log failures properly',
			function() {
				var logger = new Logger.constructor();

				logger.log(1, 'Has error', 'foo.js', 'error');

				assert.isObject(logger.testStats);
				assert.equal(logger.testStats.failures, 1);
			}
		);
	}
);