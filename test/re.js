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
						var loggerResult = re.hasExtraNewLines(item, index, collection);

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

				endingNewLine.forEach(
					function(item, index, collection) {
						var result = re.hasExtraNewLines(item, index, collection);
						var loggerResult = re.hasExtraNewLines(item, index, collection);

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
			}
		);
	}
);