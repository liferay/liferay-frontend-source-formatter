var path = require('path');
var fs = require('fs');
var chai = require('chai');
var _ = require('lodash');
var sinon = require('sinon');

chai.use(require('chai-string'));

var assert = chai.assert;

var base = require('../lib/base');
var cli = require('../lib/cli');

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

describe(
	'CLI',
	function () {
		'use strict';

		var MAP_CONTENT = {
			'foo.js': ['var x = function(){\n};', 'var x = function() {\n};'],
			'bar.html': ['<div class="foo bar"></div>', '<div class="bar foo"></div>'],
			'baz.css': ['background: #FFFFFF', 'background: #FFF'],
		};

		var sandbox;
		beforeEach(function () {
			sandbox = sinon.sandbox.create();
		});

		afterEach(function () {
			sandbox.restore();
		});

		it(
			'should read files correctly',
			function() {

				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][0]);
				});

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js', 'bar.html', 'baz.css'],
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(fs.readFile.calledThrice, 'fs.read should have been called 3 times');
				assert.isTrue(fs.readFile.calledWith('foo.js'), 'foo.js should have been read');
				assert.isTrue(fs.readFile.calledWith('bar.html'), 'bar.html should have been read');
				assert.isTrue(fs.readFile.calledWith('baz.css'), 'baz.css should have been read');

			}
		);

		it(
			'should write files correctly',
			function() {

				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][0]);
				});

				sandbox.stub(fs, 'writeFile', function (path, contents, callback) {
					callback(null, MAP_CONTENT[path][1]);
				});

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js', 'bar.html', 'baz.css'],
						flags: {
							inlineEdit: true
						},
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(fs.writeFile.calledThrice, 'fs.write should have been called 3 times');
				assert.isTrue(fs.writeFile.calledWith('foo.js'), 'foo.js should have been written to');
				assert.isTrue(fs.writeFile.calledWith('bar.html'), 'bar.html should have been written to');
				assert.isTrue(fs.writeFile.calledWith('baz.css'), 'baz.css should have been written to');

				fs.writeFile.args.forEach(
					function(item, index) {
						var path = item[0];
						var expectedContents = MAP_CONTENT[path][1];

						assert.equal(expectedContents, item[1], 'The contents passed to writeFile for ' + path + ' aren\'t what was expected');
					}
				);

			}
		);

		it(
			'should handle file write errors',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][0]);
				});

				sandbox.stub(fs, 'writeFile', function (path, contents, callback) {
					callback(new Error('Something went wrong'));
				});

				sandbox.stub(File, 'handleFileWriteError');

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							inlineEdit: true
						},
						log: sinon.log,
						logger: new Logger.Logger(),
						write: fs.writeFile
					}
				);

				cliInstance.init();

				assert.isTrue(fs.writeFile.calledOnce, 'fs.write should have been called 3 times');
				assert.isTrue(File.handleFileWriteError.calledOnce, 'File.handleFileWriteError should have been called once');


			}
		);


		it(
			'should ignore unrecognized files',
			function() {

				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, '');
				});

				var processFileData = sinon.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.NOOP'],
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.processFileData = processFileData;

				cliInstance.init();

				assert.isFalse(processFileData.called, 'processFileData should not have been called for a non-recognized file');
			}
		);

		it(
			'should handle metadata checking',
			function() {

				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, '');
				});

				sandbox.stub(fs, 'existsSync').returns(true);

				var cliInstance = new cli.CLI(
					{
						args: ['liferay/foo.js'],
						flags: {
							checkMetadata: true
						},
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				var metaCheckerPath = path.join(__dirname, 'fixture', 'meta.js');

				cliInstance._metaCheckerPath = metaCheckerPath;

				var metaChecker = require(metaCheckerPath);

				var checkMeta = sandbox.stub(metaChecker, 'check', function(config) {
					config.done();
				});

				cliInstance.init();

				assert.isTrue(checkMeta.called, 'metaChecker.check should have been called');

				cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							checkMetadata: true
						},
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				cliInstance._metaCheckerPath = metaCheckerPath;

				checkMeta.reset();

				cliInstance.init();

				assert.isTrue(checkMeta.notCalled, 'metaChecker.check should not have been called');
			}
		);

		it(
			'should log results properly',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][1]);
				});

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledOnce, 'log should have been called only once');

				log.reset();

				cliInstance.logResults(null, 'foo.js');

				assert.isTrue(log.notCalled, 'log should not have been called when logResults gets no input');
			}
		);

		it(
			'should log verbose details properly',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, 'var x = ;');
				});

				var log = sandbox.spy();

				var logger = new Logger.Logger();

				// logger.verboseDetails['foo.js'] =

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							verbose: true
						},
						log: log,
						logger: logger
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledTwice, 'log should have been called twice');
			}
		);

		it(
			'should log filenames properly',
			function() {
				sandbox.stub(fs, 'readFile', function (filePath, encoding, callback) {
					callback(null, MAP_CONTENT[path.basename(filePath)][0]);
				});

				var log = sandbox.spy();

				var args = ['foo.js', 'bar.html', 'baz.css'];

				var cliInstance = new cli.CLI(
					{
						args: args,
						flags: {
							filenames: true
						},
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledThrice, 'log should have been called 3 times');
				assert.equal(args.join(), log.args.join());

				log.reset();

				var pathArgs = args.map(
					function(item, index) {
						return path.join('home', 'liferay', 'modules', item);
					}
				);

				var relativeArgs = args.map(
					function(item, index) {
						return path.join('..', '..', 'modules', item);
					}
				);

				cliInstance = new cli.CLI(
					{
						args: pathArgs,
						flags: {
							filenames: true,
							relative: true
						},
						cwd: path.join('home', 'liferay', 'scripts', 'tests'),
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledThrice, 'log should have been called 3 times');
				assert.equal(relativeArgs.join(), log.args.join());
			}
		);


		it(
			'should log missing files properly',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					var err = new Error();

					callback(err);
				});

				sandbox.stub(File, 'handleFileReadError');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledThrice, 'log should have been called 3 times');
				assert.isTrue(File.handleFileReadError.calledOnce, 'File.handleFileReadError should have been called');
			}
		);

		it(
			'should log general errors properly',
			function() {
				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: [],
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.logGeneralError(new Error('Something general happened....'));

				assert.isTrue(log.calledOnce, 'log should have been called once');
				assert.startsWith(log.args[0][0], 'Something went wrong');
			}
		);

		it(
			'should open files properly',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][0]);
				});

				var cliModule = require('cli');

				sandbox.stub(cliModule, 'exec', function(command, callback) {
					if (callback) {
						callback(['sublime']);
					}
				})

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							open: true
						},
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.calledOnce, 'log should have been called only once');
				assert.isTrue(cliModule.exec.calledTwice, 'log should have been called 2 times');

				log.reset();
				cliModule.exec.reset();

				cliInstance = new cli.CLI(
					{
						args: [],
						flags: {
							open: true
						},
						log: log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(log.notCalled, 'log should not have been called');
				assert.isTrue(cliModule.exec.notCalled, 'log should not have been called');
			}
		);

		it(
			'should call junit generate',
			function() {
				sandbox.stub(fs, 'readFile', function (path, encoding, callback) {
					callback(null, MAP_CONTENT[path][0]);
				});

				var junitReporter = require('../lib/junit');

				var junit = sandbox.spy(junitReporter);

				sandbox.stub(junit.prototype, 'generate');

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							junit: true
						},
						junit: junit,
						log: sinon.log,
						logger: new Logger.Logger()
					}
				);

				cliInstance.init();

				assert.isTrue(junit.calledWithNew(), 'junit should have been instantiated');
				assert.isTrue(junit.prototype.generate.called, 'junit.prototype.generate should have been called');
			}
		);

	}
);