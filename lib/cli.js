var async = require('async');
var cli = require('cli');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var util = require('util');

var _ = require('lodash');

var argv = require('./argv');
var base = require('./base');
var colors = require('cli-color-keywords')();
var junit = require('./junit');
var re = require('./re');

var Config = require('./config');
var File = require('./file');
var Formatter = require('./formatter');

var EventEmitter = require('drip').EnhancedEmitter;

var Logger = require('./logger');

var MAP_OMIT = {
	'$0': true,
	'_': true
};

var flags = _.reduce(
	argv,
	function(res, item, index) {
		if (index.length > 1 && !MAP_OMIT[index]) {
			index = _.camelCase(index);

			res[index] = item;
		}

		return res;
	},
	{}
);

var CLI = function(config) {
	config = config || {};

	EventEmitter.call(this);

	this.flags = config.flags || flags;

	this._args = config.args || argv._;
	this._cwd = config.cwd || base.CWD;
	this._async = config.async || async;
	this._exec = config.exec || cli.exec.bind(cli);
	this.junit = config.junit || junit;
	this._log = config.log || console.log.bind(console);
	this._logger = config.logger || Logger;
	this._read = config.read || fs.readFileAsync.bind(fs);
	this._write = config.write || fs.writeFileAsync.bind(fs);
};

CLI.prototype = _.create(
	EventEmitter.prototype,
	{
		constructor: CLI,

		init: function() {
			var instance = this;

			var cfgPromise = Config.load(instance._cwd);

			return Promise.resolve(cfgPromise)
					.bind(this)
					.then(instance._loadConfig)
					.then(instance._start);
		},

		afterFormat: function(results) {
			var instance = this;

			var series = [];

			if (instance.flags.inlineEdit) {
				series = results.reduce(
					function(prev, item, index) {
						if (item && !item.err && item.contents !== item.data) {
							prev.push(instance.writeFile(item.file, item.contents));
						}

						return prev;
					},
					series
				);
			}

			return Promise.all(series)
					.then(instance.onFinish.bind(instance))
					.catch(instance.logGeneralError.bind(instance));
		},

		checkMeta: function(results) {
			if (this._CHECK_META) {
				require(this._metaCheckerPath).check(
					{
						liferayModuleDir: this._liferayModuleDir
					}
				);
			}

			return results;
		},

		createReport: function(results) {
			if (this.flags.junit) {
				var junit = new this.junit(
					{
						flags: this.flags,
						logger: this._logger
					}
				);

				results = junit.generate().return(results);
			}

			return results;
		},

		formatFile: function(contents, file) {
			var formatter = Formatter.get(file, this._logger, this.flags);

			if (formatter) {
				formatter._config = this._config;

				contents = this.processFileData(contents, formatter);

				this.isMetaCheckNeeded(file);
			}

			return contents;
		},

		hasModulesFile: function(fileDir) {
			return fs.existsSync(path.join(fileDir, 'modules.js'));
		},

		isMetaCheckNeeded: function(file) {
			if (!this._CHECK_META && this.flags.checkMetadata && path.extname(file) === '.js') {
				var fileDir = path.dirname(path.resolve(file));

				if (path.basename(fileDir) === 'liferay' && this.hasModulesFile(fileDir)) {
					this._CHECK_META = true;
					this._liferayModuleDir = fileDir;
				}
			}
		},

		logGeneralError: function(err) {
			var msg = util.format(colors.error('Something went wrong.\nDetails below:') + '\n%s', err.stack);

			this._log(msg);

			return msg;
		},

		logResults: function(out, file) {
			if (out) {
				this._log(out);
			}

			var verboseDetails = this._logger.verboseDetails[file];

			if (verboseDetails) {
				this._log(verboseDetails);
			}
		},

		onFinish: function(results) {
			if (this.flags.open) {
				this.openFiles(results);
			}

			return results;
		},

		onRead: function(contents, file) {
			return this.formatFile(contents, file);
		},

		onReadError: function(err, file) {
			var errMsg = File.handleFileReadError(err, file);

			if (errMsg) {
				this._log('');
				this._log(errMsg);
				this._log('');
			}

			return {
				contents: '',
				err: err,
				file: file
			};
		},

		openFiles: function(result) {
			var instance = this;

			var errorFiles = Object.keys(instance._logger.getErrors());

			if (errorFiles.length) {
				instance._exec(
					'git config --get user.editor',
					function(res) {
						instance._exec(
							'open -a "' + res[0] + '" "' + errorFiles.join('" "') + '"'
						);
					}
				);
			}
		},

		processFile: function(file) {
			return this._read(file, 'utf-8')
					.then(_.bindKeyRight(this, 'onRead', file))
					.error(_.bindKeyRight(this, 'onReadError', file));
		},

		processFileData: function(data, formatter) {
			var file = formatter.file;

			var contents = formatter.format(data);

			this.logResults(this.renderOutput(file), file);

			return {
				file: file,
				contents: contents,
				data: data
			};
		},

		renderOutput: function(file) {
			var flags = this.flags;

			var config = {
				showColumns: flags.showColumns
			};

			var out;

			if (flags.relative) {
				config.relative = this._cwd;
			}

			if (flags.filenames) {
				out = this._logger.renderFileNames(file, config);
			}
			else {
				config.showBanner = flags.quiet;
				config.showLintIds = flags.lintIds;

				out = this._logger.render(file, config);
			}

			return out;
		},

		writeFile: function(file, contents) {
			return this._write(file, contents)
					.then(util.format.bind(util, 'Wrote file: %s', file))
					.error(File.handleFileWriteError.bind(this, file))
					.then(_.unary(this._log).bind(this));
		},

		_loadConfig: function(config) {
			var obj = config._paths.obj;
			var err = config._paths.err;

			this._config = config;

			if (obj) {
				if (config.flags) {
					_.merge(this.flags, config.flags);
				}

				if (!this.flags.filenames) {
					this._log('Using local config from ', obj.filepath);
				}
			}
			else if (err && this.flags.verbose) {
				this._log('Could not resolve any local config: ', err, err.stack);
			}

			return config;
		},

		_start: function() {
			this.emit('init');

			return Promise.all(this._args)
					.bind(this)
					.map(_.unary(this.processFile))
					.then(this.checkMeta)
					.then(this.createReport)
					.then(this.afterFormat);
		},

		_metaCheckerPath: './meta'
	}
);

var cliInstance = new CLI();

cliInstance.CLI = CLI;

module.exports = cliInstance;