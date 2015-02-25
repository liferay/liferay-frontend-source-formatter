var async = require('async');
var cli = require('cli');
var fs = require('fs');
var path = require('path');
var util = require('util');
var updateNotifier = require('update-notifier');
var _ = require('lodash');

var argv = require('./argv');
var base = require('./base');
var junit = require('./junit');
var re = require('./re');

var File = require('./file');
var Formatter = require('./formatter');

var A = base.A;

var fileErrors = base.fileErrors;

var notifier = updateNotifier(
	{
		pkg: require('../package.json')
	}
);

if (notifier.update) {
	notifier.notify(true);
}

var args = argv._;

var INDENT = base.INDENT;

var QUIET = argv.q;
var VERBOSE = argv.v;
var RELATIVE = argv.r;
var INLINE_REPLACE = argv.i;
var FILE_NAMES = argv.filenames;
var LINT_IDS = argv['lint-ids'];

var CWD = base.CWD;
var TOP_LEVEL;

var sub = base.sub;

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

var series = args.map(
	function(file) {
		return function(done) {
			var formatter = Formatter.get(file, Logger, flags);

			if (formatter) {
				fs.readFile(
					file,
					'utf-8',
					function(err, data) {
						if (err) {
							console.log(File.handleFileReadError(err, file));
						}
						else {
							var contents = formatter.format(data);

							var config = {};

							var out;

							if (FILE_NAMES) {
								if (RELATIVE) {
									config.relative = CWD;
								}

								out = Logger.renderFileNames(file, config);
							}
							else {
								config.showBanner = QUIET;
								config.showLintIds = LINT_IDS;

								out = Logger.render(file, config);
							}

							if (out) {
								console.log(out);
							}

							if (Logger.verboseDetails) {
								console.log(Logger.verboseDetails);
							}

							if (contents !== data && INLINE_REPLACE) {
								fs.writeFile(
									file,
									contents,
									function(err) {
										var writeResults = '';

										if (err) {
											writeResults = File.handleFileWriteError(err, file);
										}
										else {
											writeResults = util.format('Wrote file: %s', file);
										}

										console.log(writeResults);
									}
								);

								return done();
							}
						}

						done();
					}
				);
			}
		};
	}
);

series.push(
	function(done) {
		if (Formatter.JS.needsModuleVerification) {
			require('./meta').check(
				{
					done: done,
					liferayModuleDir: Formatter.JS.liferayModuleDir,
					series: series
				}
			);
		}
		else {
			done();
		}
	}
);

if (argv.junit) {
	series.push(junit.generate);
}

var logGeneralError = function(err) {
	if (err) {
		console.error(('Something went wrong.\nDetails below:'.error) + '\n%s', err.stack);
	}
};

var callback = function(err, result) {
	logGeneralError(err);
};

if (argv.o) {
	callback = function(err, result) {
		logGeneralError(err);

		var errorFiles = Object.keys(fileErrors);

		if (errorFiles.length) {
			cli.exec(
				'git config --get user.editor',
				function(res) {
					cli.exec(
						'open -a "' + res[0] + '" "' + errorFiles.join('" "') + '"'
					);
				}
			);
		}
	};
}

if (RELATIVE) {
	series.unshift(
		function(done) {
			cli.exec(
				'git rev-parse --show-toplevel',
				function(res) {
					TOP_LEVEL = res;

					done();
				}
			);
		}
	);
}

async.series(series, callback);