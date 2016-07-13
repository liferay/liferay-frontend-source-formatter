var chai = require('chai');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');
var Promise = require('bluebird');

var cli = require('../lib/cli');
var File = require('../lib/file');
var Logger = require('../lib/logger');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'CLI',
	function() {
		'use strict';

		var MAP_CONTENT = {
			'bar.html': ['<div class="foo bar"></div>', '<div class="bar foo"></div>'],
			'baz.css': ['background: #FFFFFF', 'background: #FFF'],
			'foo.js': ['var x = function(){\n};', 'var x = function() {\n};']
		};

		var invalidContentStub = function(path, encoding, callback) {
			var file = MAP_CONTENT[path];

			if (file) {
				callback(null, file[0]);
			}
			else {
				var err = new Error('File missing');

				err.errno = 34;
				err.code = 'ENOENT';

				callback(err);
			}
		};

		var validContentStub = function(path, contents, callback) {
			callback(null, MAP_CONTENT[path][1]);
		};

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
			'should read files correctly',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);

				var logger = new Logger.constructor();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js', 'bar.html', 'baz.css'],
						log: sinon.log,
						logger: logger
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(fs.readFile.calledThrice, 'fs.readFile should have been called 3 times, it was instead called ' + fs.readFile.callCount + ' times');
						assert.isTrue(fs.readFile.calledWith('foo.js'), 'foo.js should have been read');
						assert.isTrue(fs.readFile.calledWith('bar.html'), 'bar.html should have been read');
						assert.isTrue(fs.readFile.calledWith('baz.css'), 'baz.css should have been read');

						done();
					}
				);
			}
		);

		it(
			'should write files correctly',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);
				sandbox.stub(fs, 'writeFile').callsArgWith(2, null);

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js', 'bar.html', 'baz.css'],
						flags: {
							inlineEdit: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				sandbox.spy(cliInstance, 'logResults');

				cliInstance.init().then(
					function() {
						assert.isTrue(fs.writeFile.calledThrice, 'fs.writeFile should have been called 3 times, it was instead called ' + fs.writeFile.callCount + ' times');
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

						assert.equal(log.callCount, 6, '.log should have been called 6 times, it was instead called ' + log.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should handle file write errors',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);
				sandbox.stub(fs, 'writeFile').callsArgWith(2, new Error('Something went wrong'));

				sandbox.stub(File, 'handleFileWriteError');

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							inlineEdit: true
						},
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(fs.writeFile.calledOnce, 'fs.writeFile should have been called once, it was instead called ' + fs.writeFile.callCount + ' times');
						assert.isTrue(File.handleFileWriteError.calledOnce, 'File.handleFileWriteError should have been called once, it was instead called ' + File.handleFileWriteError.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should ignore unrecognized files',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				var processFileData = sinon.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.NOOP'],
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.processFileData = processFileData;

				cliInstance.init().then(
					function() {
						assert.isFalse(processFileData.called, 'processFileData should not have been called for a non-recognized file, it was instead called ' + processFileData.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should check metadata',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');
				sandbox.stub(fs, 'existsSync').returns(true);

				var cliInstance = new cli.CLI(
					{
						args: ['liferay/foo.js'],
						flags: {
							checkMetadata: true
						},
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				var metaCheckerPath = path.join(__dirname, 'fixture', 'meta.js');

				cliInstance._metaCheckerPath = metaCheckerPath;

				var metaChecker = require(metaCheckerPath);

				var checkMeta = sandbox.stub(metaChecker, 'check');

				cliInstance.init().then(
					function() {
						assert.isTrue(checkMeta.called, 'metaChecker.check should have been called, it was instead called ' + checkMeta.callCount + ' times');
					}
				)
				.done(done);
			}
		);

		it(
			'should not check metadata',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');
				sandbox.stub(fs, 'existsSync').returns(true);

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							checkMetadata: true
						},
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				var metaCheckerPath = path.join(__dirname, 'fixture', 'meta.js');

				cliInstance._metaCheckerPath = metaCheckerPath;

				var metaChecker = require(metaCheckerPath);

				var checkMeta = sandbox.stub(metaChecker, 'check');

				cliInstance.init().then(
					function() {
						assert.isTrue(checkMeta.notCalled, 'metaChecker.check should not have been called, it was instead called ' + metaChecker.check.callCount + ' times');
					}
				).done(done);
			}
		);

		it(
			'should log results properly',
			function(done) {
				sandbox.stub(fs, 'readFile', validContentStub);

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledOnce, 'log should have been called only once, it was instead called ' + log.callCount + ' times');

						log.reset();

						cliInstance.logResults(null, 'foo.js');

						assert.isTrue(log.notCalled, 'log should not have been called when logResults gets no input, it was instead called ' + log.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should log verbose details properly',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, 'var x = ;');

				var log = sandbox.spy();

				var logger = new Logger.constructor();

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

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledTwice, 'log should have been called twice, it was instead called ' + log.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should log filenames properly',
			function(done) {
				sandbox.stub(
					fs,
					'readFile',
					function(filePath, encoding, callback) {
						callback(null, MAP_CONTENT[path.basename(filePath)][0]);
					}
				);

				var log = sandbox.spy();

				var args = ['foo.js', 'bar.html', 'baz.css'];

				var cliInstance = new cli.CLI(
					{
						args: args,
						flags: {
							filenames: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledThrice, 'log should have been called 3 times, it was instead called ' + log.callCount + ' times');
						assert.equal(args.join(), log.args.join());

						done();
					}
				);
			}
		);

		it(
			'should log relative filenames properly',
			function(done) {
				sandbox.stub(
					fs,
					'readFile',
					function(filePath, encoding, callback) {
						callback(null, MAP_CONTENT[path.basename(filePath)][0]);
					}
				);

				var log = sandbox.spy();

				var args = ['foo.js', 'bar.html', 'baz.css'];

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

				var cliInstance = new cli.CLI(
					{
						args: pathArgs,
						cwd: path.join('home', 'liferay', 'scripts', 'tests'),
						flags: {
							filenames: true,
							relative: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledThrice, 'log should have been called 3 times, it was instead called ' + log.callCount + ' times');
						assert.equal(relativeArgs.join(), log.args.join());

						done();
					}
				);
			}
		);

		it(
			'should log missing files properly',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, new Error());

				sandbox.stub(File, 'handleFileReadError').returns('Missing file');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledThrice, 'log should have been called 3 times, it was instead called ' + log.callCount + ' times');
						assert.isTrue(File.handleFileReadError.calledOnce, 'File.handleFileReadError should have been called, it was instead called ' + File.handleFileReadError.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should not write missing files',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);
				sandbox.stub(fs, 'writeFile').callsArgWith(2, null);

				sandbox.stub(File, 'handleFileReadError').returns('Missing file');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js', 'bar.html', 'not_a_file.css'],
						flags: {
							inlineEdit: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(fs.writeFile.calledTwice, 'writeFile should have been called only 2 times, it was instead called ' + fs.writeFile.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should ignore directories properly',
			function(done) {
				var err = new Error();

				err.errno = -21;
				err.code = 'EISDIR';

				sandbox.stub(fs, 'readFile').callsArgWith(2, err);

				sandbox.spy(File, 'handleFileReadError');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['./'],
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.notCalled, 'log should not have been called, it was instead called ' + log.callCount + ' times');
						assert.isTrue(File.handleFileReadError.returned(''), 'File.handleFileReadError should have returned nothing');

						done();
					}
				);
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
						logger: new Logger.constructor()
					}
				);

				cliInstance.logGeneralError(new Error('Something general happened....'));

				assert.isTrue(log.calledOnce, 'log should have been called once, it was instead called ' + log.callCount + ' times');
				assert.startsWith(log.args[0][0], 'Something went wrong');
			}
		);

		it(
			'should open files properly',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);

				var cliModule = require('cli');

				sandbox.stub(
					cliModule,
					'exec',
					function(command, callback) {
						if (callback) {
							callback(['sublime']);
						}
					}
				);

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							open: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(log.calledOnce, 'log should have been called only once, it was instead called ' + log.callCount + ' times');
						assert.isTrue(cliModule.exec.calledTwice, 'cliModule.exec should have been called 2 times, it was instead called ' + cliModule.exec.callCount + ' times');

						done();
					}
				);
			}
		);

		it(
			'should not log without arguments',
			function() {
				sandbox.stub(fs, 'readFile', invalidContentStub);

				var cliModule = require('cli');

				sandbox.stub(
					cliModule,
					'exec',
					function(command, callback) {
						if (callback) {
							callback(['sublime']);
						}
					}
				);

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: [],
						flags: {
							open: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init();

				assert.isTrue(log.notCalled, 'log should not have been called, it was instead called ' + log.callCount + ' times');
				assert.isTrue(cliModule.exec.notCalled, 'cliModule.exec should not have been called, it was instead called ' + cliModule.exec.callCount + ' times');
			}
		);

		it(
			'should call junit generate',
			function(done) {
				sandbox.stub(fs, 'readFile', invalidContentStub);

				var junitReporter = require('../lib/junit');

				var junit = sandbox.spy(junitReporter);

				sandbox.stub(junit.prototype, 'generate').returns(Promise.resolve());

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						flags: {
							junit: true
						},
						junit: junit,
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(junit.calledWithNew(), 'junit should have been instantiated');
						assert.isTrue(junit.prototype.generate.called, 'junit.prototype.generate should have been called, it was instead called ' + junit.prototype.generate.callCount + ' times');
					}
				).done(done);
			}
		);

		it(
			'should handle custom config',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						cwd: path.join(__dirname, 'fixture/config/flags'),
						flags: {
							quiet: false
						},
						log: sinon.log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(cliInstance.flags.quiet);

						done();
					}
				);
			}
		);

		it(
			'should handle custom config misc',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						cwd: path.join(__dirname, 'fixture/config/filenames'),
						flags: {
							filenames: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isNotTrue(cliInstance.flags.quiet);
						assert.isUndefined(log.args[0]);

						done();
					}
				);
			}
		);

		it(
			'should handle invalid config',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						cwd: path.join(__dirname, 'fixture/config/bad_config'),
						flags: {
							verbose: false
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isFalse(cliInstance.flags.verbose);
						assert.notStartsWith(log.args[0][0], 'Could not resolve any local config');

						done();
					}
				);
			}
		);

		it(
			'should handle invalid config logging',
			function(done) {
				sandbox.stub(fs, 'readFile').callsArgWith(2, null, '');

				var log = sandbox.spy();

				var cliInstance = new cli.CLI(
					{
						args: ['foo.js'],
						cwd: path.join(__dirname, 'fixture/config/bad_config'),
						flags: {
							quiet: false,
							verbose: true
						},
						log: log,
						logger: new Logger.constructor()
					}
				);

				cliInstance.init().then(
					function() {
						assert.isTrue(cliInstance.flags.verbose);
						assert.startsWith(log.args[0][0], 'Could not resolve any local config');

						done();
					}
				);
			}
		);
	}
);