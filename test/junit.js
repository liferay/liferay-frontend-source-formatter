var chai = require('chai');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');
var xsd = require('xsd-schema-validator');

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
				var logger = new Logger.constructor();

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
			'should generate a valid JUnit report',
			function(done) {
				var logger = new Logger.constructor();

				logger.log(1, 'Content is not valid', 'foo.js');
				logger.log(38, 'Missing space between selector and bracket: &.no-title .asset-user-actions{', 'xmlentity.css', 'error');
				logger.log(39, '<fooo', 'xmlentity.css', 'error');
				logger.log(141, 'Sort attribute values: javascript:�0�removeGroup(', 'unicode.css', 'error');

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

				// Raise mocha's default timeout of 2s to 10s...
				// I'm hoping this keeps travis from failing so often :P

				this.timeout(5000);

				var cb = sandbox.spy();

				var reporter = new junit(
					{
						logger: logger
					}
				);

				reporter.generate(cb);

				xsd.validateXML(
					cb.args[0][1],
					path.join(__dirname, 'fixture', 'junit-4.xsd'),
					function(err, result) {
						assert.isTrue(result.valid, err);
						done();
					}
				);
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