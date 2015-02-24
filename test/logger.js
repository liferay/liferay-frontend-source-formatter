process.argv.push('--no-color');

var path = require('path');
var fs = require('fs');
// var assert = require('assert');
var chai = require('chai');
chai.use(require('chai-string'));
// var expect = require('chai').expect;
var _ = require('lodash');

var assert = chai.assert;

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

var sub = require('../lib/base').sub;

describe('Logger', function () {

	it(
		'should render file names properly',
		function() {
			var logger = new Logger.Logger();

			var out = logger.renderFileNames('foo.js');

			assert.equal(out, '');

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			out = logger.renderFileNames('foo.js');

			assert.equal(out, 'foo.js');

			out = logger.renderFileNames(new File('foo.js'));

			assert.equal(out, 'foo.js');

			out = logger.renderFileNames(
				'foo.js',
				{
					relative: __dirname
				}
			);

			assert.equal(out, path.relative(__dirname, 'foo.js'));
		}
	);

	it(
		'should render TPL properly',
		function() {
			var logger = new Logger.Logger();

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			logger.TPL = 'File:{{{file}}}';

			var out = logger.render('foo.js');

			assert.equal(out, 'File:foo.js');
		}
	);

	it(
		'should render TPL_PATH properly',
		function() {
			var logger = new Logger.Logger();

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			logger.TPL_PATH = path.join(__dirname, 'fixture', 'logger.tpl');

			var out = logger.render('foo.js');

			assert.isAbove(out.length, 0);

			assert.equal(out, 'File:foo.js\nLine 1:Has error\n');

			out = logger.render(
				'foo.js',
				{
					showLintIds: true
				}
			);

			assert.equal(out, 'File:foo.js\nLine 1:Has error\nruleId:rule-name');

			out = logger.render('noop.js');

			assert.equal(out, 'File:noop.js\nNo errors\n');

			out = logger.render(
				'noop.js',
				{
					showBanner: true
				}
			);

			assert.equal(out, '');
		}
	);

	it(
		'should log errors properly',
		function() {
			var logger = new Logger.Logger();

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			assert.property(logger.fileErrors, 'foo.js');
			assert.isArray(logger.fileErrors['foo.js']);
		}
	);

	it(
		'should get logged errors properly',
		function() {
			var logger = new Logger.Logger();

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			var loggedErrors = logger.getErrors('foo.js');

			assert.equal(loggedErrors.length, 1);

			var loggedError = loggedErrors[0];

			assert.isObject(loggedError);
			assert.equal(loggedError.msg, 'Has error');
			assert.equal(loggedError.line, 1);
			assert.equal(loggedError.type, 'error');
			assert.equal(loggedError.ruleId, 'rule-name');

			var unLoggedErrors = logger.getErrors('foo.txt');

			assert.equal(unLoggedErrors.length, 0);

			var fileErrors = logger.getErrors();

			assert.isObject(fileErrors);
			assert.equal(fileErrors, logger.fileErrors);
		}
	);

	it(
		'should log failures properly',
		function() {
			var logger = new Logger.Logger();

			logger.log(1, 'Has error', 'foo.js', 'error', {ruleId: 'rule-name'});

			assert.isObject(logger.testStats);
			assert.equal(logger.testStats.failures, 1);
		}
	);

});