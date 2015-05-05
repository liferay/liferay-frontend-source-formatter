var chai = require('chai');
var sinon = require('sinon');

var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');
var sub = require('../lib/base').sub;

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Formatter',
	function() {
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
			'should return the proper formatter for a file',
			function() {
				var customFormatGetter = Formatter.create(
					{
						extensions: /\.foo$/,
						id: 'customFormatGetter'
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

		it(
			'should ignore excluded files',
			function() {
				var constructor = sandbox.spy();

				sandbox.spy(Formatter.prototype, 'format');

				var customFormat = sandbox.spy();

				var FooCustom1 = Formatter.create(
					{
						extensions: /\.test$/,
						id: 'TestFiles',
						excludes: /foo\.test$/,
						prototype: {
							format: customFormat
						}
					}
				);

				var logger = new Logger.Logger();

				var formatter1 = Formatter.get('foo.test', logger);

				formatter1.format('blah');

				assert.isFalse(customFormat.called, '.format should not have been called');

				var formatter2 = Formatter.get('hello.test', logger);

				formatter2.format('blah');

				assert.isTrue(customFormat.called, '.format should have been called');

				var formatter3 = Formatter.get('foo.test', logger, {force: true});

				formatter3.format('blah');

				assert.isTrue(customFormat.called, '.format should have been called with force');
			}
		);
	}
);

describe(
	'Formatter Base',
	function() {
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
						extensions: /\.txt$/,
						id: 'initCustomFormatter',
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
	}
);

describe(
	'Formatter.create',
	function() {
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
						extensions: /\.js$/,
						id: testFormatterId
					}
				);

				assert.throws(
					function() {
						Formatter.create(
							{
								extensions: /\.js$/,
								id: testFormatterId
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
					'The extensions property must be a RegExp Object'
				);

				assert.throws(
					function() {
						Formatter.create(
							{
								extensions: '',
								id: 'FooExtTest2'
							}
						);
					},
					'The extensions property must be a RegExp Object'
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
						extensions: /\.js$/,
						id: 'FooCustom1'
					}
				);

				new FooCustom1();

				assert.isTrue(constructor.called);
			}
		);
	}
);