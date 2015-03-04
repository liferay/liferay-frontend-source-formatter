var chai = require('chai');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

var junit = require('../lib/junit');
var Logger = require('../lib/logger');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'JUnit reporting',
	function() {
		'use strict';

		var sandbox;

		beforeEach(
			function() {
				sandbox = sinon.sandbox.create();
			}
		);

		afterEach(
			function() {
				sandbox.restore();
			}
		);

		it(
			'should generate a JUnit report',
			function() {
				var logger = new Logger.Logger();

				logger.log(1, 'Content is not valid', 'foo.js');
				logger.log(2, 'Content is not valid', 'foo.js', 'error');
				logger.log(5, 'Something is not valid', 'foo.js', 'error');
				logger.log(3, 'Content is not valid', 'foo.js', 'warning');
				logger.log(10, 'Content is not valid', 'bar.html', 'warning');
				logger.log(4, 'Content is not valid', 'foo.js');
				logger.log(1, 'Content is not valid', 'baz.css', 'error');

				sandbox.stub(
					fs,
					'readFile',
					function(path, encoding, callback) {
						if (path.indexOf('junit_report.tpl') > -1) {
							return callback(null, fs.readFileSync(path, encoding));
						}

						callback(null, '');
					}
				);

				sandbox.stub(
					fs,
					'writeFile',
					function(path, content, callback) {
						callback(null, content);
					}
				);

				var cb = sandbox.spy();

				var reporter = new junit(
					{
						logger: logger
					}
				);

				reporter.generate(cb);

				assert.isTrue(fs.writeFile.called, 'writeFile should have been called');
				assert.isTrue(cb.called, 'cb should have been executed');

				assert.equal(cb.args[0][1], fs.readFileSync(path.join(__dirname, 'fixture', 'result.xml'), 'utf-8'), 'The result should match what we expect');
			}
		);

		it(
			'should generate a JUnit report to a custom path',
			function(done) {
				sandbox.stub(Logger);

				Logger.log(1, 'Content is not valid', 'foo.js');

				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				sandbox.stub(
					fs,
					'writeFile',
					function(path, content, callback) {
						callback(null, content);

						assert.isTrue(cb.called, 'cb should have been executed');
						assert.equal(path, 'custom_result.xml');

						done();
					}
				);

				var cb = sandbox.spy();

				var reporter = new junit(
					{
						flags: {
							junit: 'custom_result.xml'
						}
					}
				);

				reporter.generate(cb);
			}
		);
	}
);