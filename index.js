#!/usr/bin/env node

var async = require('async');
var cli = require('cli');
var fs = require('fs');
var path = require('path');
var updateNotifier = require('update-notifier');

var argv = require('./lib/argv');
var base = require('./lib/base');
var junit = require('./lib/junit');
var re = require('./lib/re');

var File = require('./lib/file');
var Formatter = require('./lib/formatter');

var A = base.A;

var fileErrors = base.fileErrors;

var notifier = updateNotifier(
	{
		pkg: require('./package.json')
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

var CWD = base.CWD;
var TOP_LEVEL;

var getLineNumber = A.cached(
	function(line) {
		var m = line.match(/Lines?: ([0-9]+)/);

		return parseInt(m && m[1], 10) || 0;
	}
);

var sortErrors = function(a, b) {
	var aNum = getLineNumber(a);
	var bNum = getLineNumber(b);

	return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
};

var sub = base.sub;

var getFileErrors = function(file) {
	return fileErrors[file] || [];
};

var logFormatErrors = function(errors, file) {
	var includeHeaderFooter = (errors.length || !QUIET);

	if (includeHeaderFooter) {
		var fileName = file;

		if (RELATIVE) {
			file = path.relative(CWD, file);
		}

		console.log('File:'.blackBG + ' ' + file.underline);
	}

	errors = errors.map(
		function(error) {
			return error.err;
		}
	);

	if (errors.length) {
		errors.sort(sortErrors);

		console.log(INDENT + errors.join('\n' + INDENT));
	}
	else if (includeHeaderFooter) {
		console.log(INDENT + 'clear');
	}

	if (includeHeaderFooter) {
		console.log('----'.subtle);
	}
};

var logFileNames = function(errors, file) {
	if (errors.length) {
		var fileName = file;

		if (RELATIVE) {
			file = path.relative(CWD, file);
		}

		console.log(file);
	}
};

var Logger = require('./lib/logger');

var series = args.map(
	function(file) {
		return function(done) {
			var fileObj = new File(file);

			var formatter = Formatter.get(fileObj);

			if (formatter) {
				fileObj.format(formatter).then(function(data) {
					var logMethod = logFormatErrors;

					if (FILE_NAMES) {
						logMethod = logFileNames;
					}

					logMethod(getFileErrors(file), file);

					if (this.isDirty() && INLINE_REPLACE) {
						this.write().then(
							function(data) {
								console.log(data, '----written file----');
							}
						).catch(this.handleFileWriteError);
					}

					done(null, data);
				})
				.error(fileObj.handleFileReadError)
				.catch(
					function(err) {
						console.error('Something went wrong.\nDetails below:\n%s', err.stack);
					}
				);
			}
		};
	}
);

series.push(
	function(done) {
		if (Formatter.JS.needsModuleVerification) {
			require('./lib/meta').check(
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

var callback = function() {};

if (argv.o) {
	callback = function(err, result) {
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