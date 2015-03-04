var chai = require('chai');
var sinon = require('sinon');

var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');
var sub = require('../lib/base').sub;

chai.use(require('chai-string'));

var assert = chai.assert;

describe('Formatter', function () {

	it(
		'should return the proper formatter for a file',
		function() {
			var customFormatGetter = Formatter.create(
				{
					id: 'customFormatGetter',
					extensions: '*.foo'
				}
			);

			var formatter = Formatter.get('path/to/file.foo');

			assert.equal(formatter.constructor, customFormatGetter);
		}
	);

	it(
		'should not return an unregistered formatter',
		function() {
			var formatter = Formatter.get('path/to/file.missing');

			assert.isUndefined(formatter);
		}
	);

});

describe('Formatter Base', function () {
	var sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});

	it(
		'should accept a custom logger',
		function() {
			var formatter = new Formatter('path/to/file', new Logger.Logger());

			assert.isTrue(formatter.logger instanceof Logger.Logger);
		}
	);

	it(
		'should return a formatted string from base .format',
		function() {
			var formatter = new Formatter('path/to/file', new Logger.Logger());

			assert.equal(formatter.format('foo'), 'foo');
		}
	);

	it(
		'should execute init method',
		function() {
			var init = sandbox.spy();

			var CustomFormatter = Formatter.create(
				{
					id: 'initCustomFormatter',
					extensions: '*.txt',
					prototype: {
						init: init
					}
				}
			);

			new CustomFormatter('path/to/file');

			assert.isTrue(init.called);
		}
	);

	it(
		'should register an empty file path as <input>',
		function() {
			var customFormatter = new Formatter('');

			assert.equal(customFormatter.file, '<input>');
		}
	);

});

describe('Formatter.create', function () {
	var sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});

	it(
		'should throw an error when called without arguments',
		function() {
			assert.throws(
				Formatter.create,
				'You must pass an object to Formatter.create'
			);
		}
	);

	it(
		'should throw an error when called without an id property',
		function() {
			assert.throws(
				function() {
					Formatter.create({});
				},
				'You must give this formatter an id with the id property'
			);
		}
	);

	it(
		'should throw an error when called without a duplicate id property',
		function() {
			var testFormatterId = 'TestFormatter';

			Formatter.create(
				{
					id: testFormatterId,
					extensions: '*.js'
				}
			);

			assert.throws(
				function() {
					Formatter.create(
						{
							id: testFormatterId,
							extensions: '*.js'
						}
					);
				},
				sub('The id: "{0}" is already taken', testFormatterId)
			);
		}
	);

	it(
		'should throw an error when called without extensions',
		function() {
			assert.throws(
				function() {
					Formatter.create(
						{
							id: 'FooExtTest1'
						}
					);
				},
				'The extensions property must be a string, and must be glob expression'
			);

			assert.throws(
				function() {
					Formatter.create(
						{
							id: 'FooExtTest2',
							extensions: ''
						}
					);
				},
				'The extensions property must be a string, and must be glob expression'
			);
		}
	);

	it(
		'should use a custom constructor',
		function() {
			var constructor = sandbox.spy();

			var FooCustom1 = Formatter.create(
				{
					constructor: constructor,
					id: 'FooCustom1',
					extensions: '*.js'
				}
			);

			new FooCustom1();

			assert.isTrue(constructor.called);
		}
	);
});