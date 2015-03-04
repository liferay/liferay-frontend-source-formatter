var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;

var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

var sub = require('../lib/base').sub;

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

			assert.equal(formatter, null);
		}
	);

});

describe('Formatter Base', function () {

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
			var msg;
			var expectedMsg = 'init was called';

			var CustomFormatter = Formatter.create(
				{
					id: 'initCustomFormatter',
					extensions: '*.txt',
					prototype: {
						init: function(){
							msg = expectedMsg;
						}
					}
				}
			);

			new CustomFormatter('path/to/file');

			assert.equal(msg, expectedMsg);
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

	it(
		'should throw an error when called without arguments',
		function() {
			var msg;

			try {
				Formatter.create();
			}
			catch (e) {
				msg = e.message;
			}

			assert.equal(msg, 'You must pass an object to Formatter.create');
		}
	);

	it(
		'should throw an error when called without an id property',
		function() {
			var msg;

			try {
				Formatter.create({});
			}
			catch (e) {
				msg = e.message;
			}

			assert.equal(msg, 'You must give this formatter an id with the id property');
		}
	);

	it(
		'should throw an error when called without a duplicate id property',
		function() {
			var msg;

			var testFormatterId = 'TestFormatter';

			Formatter.create(
				{
					id: testFormatterId,
					extensions: '*.js'
				}
			);

			try {
				Formatter.create(
					{
						id: testFormatterId,
						extensions: '*.js'
					}
				);
			}
			catch (e) {
				msg = e.message;
			}

			assert.equal(msg, sub('The id: "{0}" is already taken', testFormatterId));
		}
	);

	it(
		'should throw an error when called without extensions',
		function() {
			var msg;

			var expectedErrorMsg = 'The extensions property must be a string, and must be glob expression';

			try {
				Formatter.create(
					{
						id: 'FooExtTest1'
					}
				);
			}
			catch (e) {
				msg = e.message;
			}

			assert.equal(msg, expectedErrorMsg);

			msg = undefined;

			try {
				Formatter.create(
					{
						id: 'FooExtTest2',
						extensions: ''
					}
				);
			}
			catch (e) {
				msg = e.message;
			}

			assert.equal(msg, expectedErrorMsg);
		}
	);

	it(
		'should use a custom constructor',
		function() {
			var msg;
			var expectedMsg = 'constructor was called';

			var FooCustom1 = Formatter.create(
				{
					constructor: function() {
						msg = expectedMsg;
					},
					id: 'FooCustom1',
					extensions: '*.js'
				}
			);

			new FooCustom1();

			assert.equal(msg, expectedMsg);
		}
	);

});