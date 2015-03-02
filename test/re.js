var path = require('path');
var fs = require('fs');
var chai = require('chai');
var _ = require('lodash');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	're.js',
	function () {
		'use strict';

		var re = require('../lib/re');

		it(
			'should find extra newlines at beginning',
			function() {
				var startingNewLine = ['', 'foo'];

				var results = [];

				var logger = function(line, msg) {
					return results.push(line + msg);
				};

				startingNewLine.forEach(
					function(item, index, collection) {
						var result = re.hasExtraNewLines(item, index, collection);
						var loggerResult = re.hasExtraNewLines(item, index, collection, logger);

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

				var results = [];

				var logger = function(line, msg) {
					return results.push(line + msg);
				};

				endingNewLine.forEach(
					function(item, index, collection) {
						var result = re.hasExtraNewLines(item, index, collection);
						var loggerResult = re.hasExtraNewLines(item, index, collection, logger);

						if (index === 0) {
							assert.isFalse(result);
							assert.isFalse(loggerResult);
						}
						else if(index === collection.length - 1) {
							assert.isTrue(result);
							assert.isTrue(loggerResult);
						}
					}
				);

				assert.isAbove(results.length, 0);
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
						},
					}
				};

				var ruleInstance = new re.re(rulesObject);

				var results = [];

				var item = ruleInstance.iterateRules('ruleTest', 'test foo test', {
					item: 'test foo test',
					file: 'foo.js',
					logger: function(lineNum, msg){
						results.push(lineNum + msg);
					}
				});

				assert.isAbove(results.length, 0);
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
						},
					}
				};

				var ruleInstance = new re.re(rulesObject);

				var results = [];

				var item = ruleInstance.iterateRules(rulesObject.ruleTest, 'test foo test', {
					item: 'test foo test',
					file: 'foo.js',
					logger: function(lineNum, msg){
						results.push(lineNum + msg);
					}
				});

				assert.isAbove(results.length, 0);
				assert.equal(item, 'test foo test');
			}
		);

		it(
			'should handle formatItem properly',
			function() {
				var ruleInstance = new re.re(
					{
						ruleTest: {
							logging: {
								replacer: true,
								message: 'Found foo: {1}',
								regex: /foo/
							},
						}
					}
				);

				var results = [];
				var resultsFormatter = [];

				var item = ruleInstance.iterateRules('ruleTest', 'test foo test', {
					item: 'test foo test',
					file: 'foo.js',
					formatItem: function(item, context) {
						resultsFormatter.push(item);
						return 'foo';
					},
					logger: function(lineNum, msg) {
						results.push(lineNum + msg);
					}
				});

				assert.equal(results.length, 1);
				assert.equal(resultsFormatter.length, 1);
				assert.equal(item, 'foo');
			}
		);

		it(
			'should trim line by default',
			function() {
				var ruleInstance = new re.re(
					{
						ruleTest: {
							logging: {
								replacer: true,
								message: 'Found foo: {1}',
								regex: /foo/
							},
						}
					}
				);

				var results = [];

				var item = ruleInstance.iterateRules('ruleTest', ' test foo test ', {
					item: ' test foo test ',
					file: 'foo.js',
					formatItem: false,
					logger: function(lineNum, msg) {
						results.push(lineNum + msg);
					}
				});

				assert.equal(results.length, 1);
				assert.equal(item, ' test foo test ');
			}
		);

		it(
			'should not iterate non-existant rules',
			function() {
				var ruleInstance = new re.re({});

				var results = [];

				var item = ruleInstance.iterateRules('nonExistantRules', 'test foo test', {
					item: 'test foo test',
					file: 'foo.js',
					logger: function(lineNum, msg){
						results.push(lineNum + msg);
					}
				});

				assert.equal(results.length, 0);
				assert.equal(item, 'test foo test');
			}
		);

		it(
			'should not iterate ignored lines',
			function() {
				var ruleInstance = new re.re(
					{
						ignoredRuleTest: {
							IGNORE: /^\t/,
							logging: {
								message: 'Found foo: {1}',
								regex: /foo/
							},
						}
					}
				);

				var results = [];

				var itemString = '	test foo test';

				var item = ruleInstance.iterateRules('ignoredRuleTest', itemString, {
					item: itemString,
					file: 'foo.js',
					logger: function(lineNum, msg){
						results.push(lineNum + msg);
					}
				});

				assert.equal(results.length, 0);
				assert.equal(item, itemString);
			}
		);

		it(
			'should get the value from an object properly',
			function() {
				var ruleInstance = new re.re({});

				var obj = {
					foo: {
						bar: 1
					}
				};

				var value = ruleInstance.getValue(obj, 'foo.bar');

				assert.equal(value, 1);

				var value = ruleInstance.getValue(obj, ['foo', 'bar']);

				assert.equal(value, 1);
			}
		);
	}
);