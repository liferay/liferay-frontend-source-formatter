'use strict';

var cli = require('cli');
var Promise = require('bluebird');

var fs = Promise.promisifyAll(require('fs'));
var glob = Promise.promisify(require('glob'));
var path = require('path');
var util = require('util');

var _ = require('lodash');

var argv = require('./argv');

var colors = require('cli-color-keywords')();
var junit = require('./junit');

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
	(res, item, index) => {
		if (index.length > 1 && !MAP_OMIT[index]) {
			index = _.camelCase(index);

			res[index] = item;
		}

		return res;
	},
	{}
);

var filterFileErrors = errors => _.reject(errors, ['type', 'ignored']);

class CLI extends EventEmitter {
	constructor(config) {
		super();

		config = config || {};

		this._configs = {};
		this._configFiles = {};

		this.flags = _.defaults(config.flags, flags);

		this._args = config.args || argv._;
		this._cwd = config.cwd || process.cwd();
		this._exec = config.exec || cli.exec.bind(cli);
		this.junit = config.junit || junit;
		this._log = config.log || console.log.bind(console);
		this._logger = config.logger || Logger;
		this._read = config.read || fs.readFileAsync.bind(fs);
		this._write = config.write || fs.writeFileAsync.bind(fs);
	}

	init() {
		var instance = this;

		this._config = new Config.Loader(
			{
				cwd: instance._cwd
			}
		);

		return Promise.map(instance._args, _.unary(glob))
		.then(
			args => {
				return args.map(
					(item, index) => {
						if (!item.length) {
							item = instance._args[index];
						}

						return item;
					}
				);
			}
		)
		.then(_.flatten)
		.then(
			args => {
				instance._args = args;
			}
		)
		.bind(instance)
		.then(this._loadConfigs)
		.then(
			configs => {
				instance._configs = configs;

				return configs;
			}
		)
		.bind(instance)
		.then(instance._start);
	}

	afterFormat(results) {
		var instance = this;

		var series = [];

		if (instance.flags.inlineEdit) {
			series = Promise.reduce(
				results,
				(prev, item, index) => {
					if (item && !item.err && item.contents !== item.data) {
						prev.push(instance.writeFile(item.file, item.contents));
					}

					return prev;
				},
				series
			);
		}

		return Promise.all(series)
				.then(instance.onFinish.bind(instance, results))
				.catch(instance.logGeneralError.bind(instance));
	}

	checkMeta(results) {
		if (this._CHECK_META) {
			require(this._metaCheckerPath).check(
				{
					liferayModuleDir: this._liferayModuleDir
				}
			);
		}

		return results;
	}

	createReport(results) {
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
	}

	formatFile(contents, file) {
		var formatter = Formatter.get(file, this._logger, this.flags);

		if (formatter) {
			formatter._config = this._configs[file];

			contents = this.processFileData(contents, formatter);

			this.isMetaCheckNeeded(file);
		}

		return contents;
	}

	hasModulesFile(fileDir) {
		return fs.existsSync(path.join(fileDir, 'modules.js'));
	}

	isMetaCheckNeeded(file) {
		if (!this._CHECK_META && this.flags.checkMetadata && path.extname(file) === '.js') {
			var fileDir = path.dirname(path.resolve(file));

			if (path.basename(fileDir) === 'liferay' && this.hasModulesFile(fileDir)) {
				this._CHECK_META = true;
				this._liferayModuleDir = fileDir;
			}
		}
	}

	logGeneralError(err) {
		var msg = util.format(`${colors.error('Something went wrong.\nDetails below:')}\n%s`, err.stack);

		this._log(msg);

		return msg;
	}

	logResults(out, file) {
		if (out) {
			this._log(out);
		}

		var verboseDetails = this._logger.verboseDetails[file];

		if (verboseDetails) {
			this._log(verboseDetails);
		}
	}

	onFinish(results) {
		if (this.flags.open) {
			this.openFiles(results);
		}

		if (this.flags.failOnErrors && this._logger.testStats.failures) {
			results.EXIT_WITH_FAILURE = true;
		}

		return results;
	}

	onRead(contents, file) {
		return this.formatFile(contents, file);
	}

	onReadError(err, file) {
		var errMsg = File.handleFileReadError(err, file);

		if (errMsg) {
			this._log('');
			this._log(errMsg);
			this._log('');
		}

		return {
			contents: '',
			err,
			file
		};
	}

	openFiles(result) {
		var instance = this;

		var errorFiles = Object.keys(instance._logger.getErrors());

		if (errorFiles.length) {
			instance._exec(
				'git config --get user.editor',
				res => {
					instance._exec(
						`open -a "${res[0]}" "${errorFiles.join('" "')}"`
					);
				}
			);
		}
	}

	processFile(file) {
		return this._read(file, 'utf-8')
				.then(_.bindKeyRight(this, 'onRead', file))
				.error(_.bindKeyRight(this, 'onReadError', file));
	}

	processFileData(data, formatter) {
		var file = formatter.file;

		var res = Promise.resolve(formatter.format(data));

		return res.bind(this).then(
			function(contents) {
				this.logResults(this.renderOutput(file), file);

				return {
					contents,
					data,
					file
				};
			}
		);
	}

	renderOutput(file) {
		var flags = this.flags;

		var config = {
			showColumns: flags.showColumns
		};

		var out;

		if (flags.relative) {
			config.relative = process.env.GIT_PWD || this._cwd;
		}

		if (flags.filenames) {
			out = this._logger.renderFileNames(file, config);
		}
		else {
			config.showBanner = flags.quiet;
			config.showLintIds = flags.lintIds;

			if (flags.quiet) {
				this._logger.filterFileErrors(
					file,
					filterFileErrors
				);
			}

			out = this._logger.render(file, config);
		}

		return out;
	}

	writeFile(file, contents) {
		return this._write(file, contents)
				.then(_.bind(_.ary(util.format, 2), util, 'Wrote file: %s', file))
				.error(File.handleFileWriteError.bind(this, file))
				.then(_.unary(this._log).bind(this));
	}

	_loadConfigs() {
		var instance = this;

		return Promise.reduce(
			instance._args,
			(prev, item, index) => {
				var filePath = path.resolve(instance._cwd, path.dirname(item));

				var res;

				if (instance.flags.config) {
					res = instance._config.load(filePath);
				}
				else {
					var cfg = new Config({});

					cfg._paths.cwd = instance._cwd;

					res = Promise.resolve(cfg);
				}

				return res.then(
					config => {
						prev[item] = config;

						var obj = config._paths.obj;

						if (obj) {
							instance._configFiles[obj.filepath] = true;
						}

						return prev;
					}
				);
			},
			{}
		);
	}

	_notifyConfig() {
		if (this.flags.config && !this.flags.filenames) {
			var configFiles = _.keys(this._configFiles);

			var configSize = configFiles.length;

			if (configSize) {
				var msg;

				if (configSize === 1) {
					msg = `Using local config from ${configFiles[0]}`;
				}
				else if (this.flags.verbose) {
					msg = `Using local config from: \n${configFiles.join('\n')}`;
				}
				else {
					msg = `Using local config from ${configSize} files. Pass -v to see all locations`;
				}

				msg += '\n';

				this._log(msg);
			}
		}
	}

	_start() {
		this.emit('init');

		this._notifyConfig();

		return Promise.all(this._args)
				.bind(this)
				.mapSeries(_.unary(this.processFile))
				.then(this.checkMeta)
				.then(this.createReport)
				.then(this.afterFormat);
	}
}

CLI.prototype._metaCheckerPath = './meta';

var cliInstance = new CLI();

cliInstance.CLI = CLI;

module.exports = cliInstance;