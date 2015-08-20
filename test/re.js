var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-string'));

var assert = chai.assert;

var RE = require('../lib/re');

var re = new RE(require('../lib/rules'));

describe(
	're.js',
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
			'should find extra newlines at beginning',
			function() {
				var startingNewLine = ['', 'foo'];

				startingNewLine.forEach(
					function(item, index, collection) {
						var result = re.hasExtraNewLines(item, index, collection);
						var loggerResult = re.hasExtraNewLines(item, index, collection, _.noop);

						if (index === 0) {
							assert.isTrue(result);
							assert.isTrue(loggerResult);
						}
						else {
							assert.isFalse(result);
							assert.isFalse(loggerResult);
						}
					}
				);
			}
		);

		it(
			'should find extra newlines at end',
			function() {
				var endingNewLine = ['foo', '', ''];

				var logger = sandbox.spy();

				endingNewLine.forEach(
					function(item, index, collection) {
						var result = re.hasExtraNewLines(item, index, collection);
						var loggerResult = re.hasExtraNewLines(item, index, collection, logger);

						if (index === 0) {
							assert.isFalse(result);
							assert.isFalse(loggerResult);
						}
						else if (index === collection.length - 1) {
							assert.isTrue(result);
							assert.isTrue(loggerResult);
						}
					}
				);

				assert.isTrue(logger.called);
			}
		);

		it(
			'should iterate rules properly',
			function() {
				var rulesObject = {
					ruleTest: {
						logging: {
							message: 'Found foo: {1}',
							regex: /foo/
						}
					}
				};

				var ruleInstance = new RE(rulesObject);

				var logger = sandbox.spy();

				ruleInstance.on('message', logger);

				var item = ruleInstance.iterateRules(
					'ruleTest',
					{
						file: 'foo.js',
						fullItem: 'test foo test',
						item: 'test foo test'
					}
				);

				assert.isTrue(logger.called);
				assert.equal(item, 'test foo test');
			}
		);

		it(
			'should iterate rules from an object reference',
			function() {
				var rulesObject = {
					ruleTest: {
						logging: {
							message: 'Found foo: {1}',
							regex: /foo/
						}
					}
				};

				var ruleInstance = new RE(rulesObject);

				var logger = sandbox.spy();

				ruleInstance.on('message', logger);

				var item = ruleInstance.iterateRules(
					rulesObject.ruleTest,
					{
						file: 'foo.js',
						fullItem: 'test foo test',
						item: 'test foo test'
					}
				);

				assert.isTrue(logger.called);
				assert.equal(item, 'test foo test');
			}
		);

		it(
			'should handle formatItem properly',
			function() {
				var ruleInstance = new RE(
					{
						ruleTest: {
							logging: {
								message: 'Found foo: {1}',
								regex: /foo/,
								replacer: true
							}
						}
					}
				);

				var formatItem = sandbox.stub().returns('foo');
				var logger = sandbox.spy();

				ruleInstance.on('message', logger);

				var item = ruleInstance.iterateRules(
					'ruleTest',
					{
						file: 'foo.js',
						formatItem: formatItem,
						fullItem: 'test foo test',
						item: 'test foo test'
					}
				);

				assert.isTrue(logger.calledOnce);
				assert.isTrue(formatItem.calledOnce);
				assert.equal(item, 'foo');
			}
		);

		it(
			'should trim line by default',
			function() {
				var ruleInstance = new RE(
					{
						ruleTest: {
							logging: {
								message: 'Found foo: {1}',
								regex: /foo/,
								replacer: true
							}
						}
					}
				);

				var logger = sandbox.spy();

				ruleInstance.on('message', logger);

				var item = ruleInstance.iterateRules(
					'ruleTest',
					{
						file: 'foo.js',
						formatItem: false,
						fullItem: ' test foo test ',
						item: ' test foo test '
					}
				);

				assert.isTrue(logger.calledOnce);
				assert.equal(item, ' test foo test ');
			}
		);

		it(
			'should not iterate non-existant rules',
			function() {
				var ruleInstance = new RE({});

				var logger = sandbox.spy();

				var item = ruleInstance.iterateRules(
					'nonExistantRules',
					{
						file: 'foo.js',
						fullItem: 'test foo test',
						item: 'test foo test',
						logger: logger
					}
				);

				assert.isTrue(logger.notCalled);
				assert.equal(item, 'test foo test');
			}
		);

		it(
			'should not iterate ignored lines',
			function() {
				var ruleInstance = new RE(
					{
						ignoredRuleTest: {
							IGNORE: /^\t/,
							logging: {
								message: 'Found foo: {1}',
								regex: /foo/
							}
						}
					}
				);

				var logger = sandbox.spy();

				var itemString = '	test foo test';

				var item = ruleInstance.iterateRules(
					'ignoredRuleTest',
					{
						file: 'foo.js',
						fullItem: itemString,
						item: itemString,
						logger: logger
					}
				);

				assert.isTrue(logger.notCalled);
				assert.equal(item, itemString);
			}
		);

		it(
			'should get the value from an object properly',
			function() {
				var ruleInstance = new RE({});

				var obj = {
					foo: {
						bar: 1
					}
				};

				var value = ruleInstance.getValue(obj, 'foo.bar');

				assert.equal(value, 1);

				value = ruleInstance.getValue(obj, ['foo', 'bar']);

				assert.equal(value, 1);
			}
		);
	}
);