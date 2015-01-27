#!/usr/bin/env node

var async = require('async');
var cli = require('cli');
var colors = require('colors');
var fs = require('fs');
var path = require('path');
var updateNotifier = require('update-notifier');

var base = require('./lib/base');
var junit = require('./lib/junit');
var re = require('./lib/re');

var A = base.A;
var argv = base.argv;
var fileErrors = base.fileErrors;
var trackErr = base.trackErr;

var notifier = updateNotifier(
	{
		pkg: require('./package.json')
	}
);

if (notifier.update) {
	notifier.notify(true);
}

colors.setTheme(
	{
		error: 'red',
		help: 'cyan',
		subtle: 'grey',
		warn: 'yellow'
	}
);

var args = argv._;

if (argv.h) {
	return base.optimist.showHelp();
}

var INDENT = base.INDENT;

var QUIET = argv.q;
var VERBOSE = argv.v;
var RELATIVE = argv.r;
var INLINE_REPLACE = argv.i;

var CWD = process.env.GIT_PWD || process.cwd();
var TOP_LEVEL;

if (!argv.color) {
	colors.mode = 'none';
}

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

var iterateLines = base.iterateLines;

var iterateRules = re.iterateRules;

var checkCss = require('./lib/css');
var checkJs = require('./lib/js');
var checkHTML = require('./lib/html');

var getFileErrors = function(file) {
	return fileErrors[file] || [];
};

var getFormatter = function(file) {
	var formatter;

	if (re.REGEX_EXT_CSS.test(file)) {
		formatter = checkCss;
	}
	else if (re.REGEX_EXT_JS.test(file)) {
		formatter = checkJs;
	}
	else if (re.REGEX_EXT_HTML.test(file)) {
		formatter = checkHTML;
	}

	return formatter;
};

var handleFileReadError = function(err, file) {
	var errMsg = 'Could not open file';

	if (!fs.existsSync(file)) {
		errMsg = 'File does not exist';
	}

	console.log('%s: %s', errMsg.error, path.resolve(file));
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

var processFile = function(file, content, done) {
	var formatter = getFormatter(file);

	var data = content;

	if (content.length && formatter) {
		content = formatter(content, file);
	}

	logFormatErrors(getFileErrors(file), file);

	var changed = (content != data);

	if (INLINE_REPLACE && changed) {
		updateFile(file, content, done);
	}
	else {
		done(null, content);
	}
};

var updateFile = function(file, content, done) {
	fs.writeFile(
		file,
		content,
		function(err, result) {
			if (err) {
				return done(null, '');
			}

			done(null, content);
		}
	);
};

var series = args.map(
	function(file) {
		return function(done) {
			fs.readFile(
				file,
				'utf-8',
				function(err, content) {
					if (err) {
						handleFileReadError(err, file);

						return done(null, '');
					}

					processFile(file, content, done);
				}
			);
		};
	}
);

series.push(
	function(done) {
		if (checkJs.needsModuleVerification) {
			require('./lib/meta').check(
				{
					cb: done,
					liferayModuleDir: checkJs.liferayModuleDir,
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