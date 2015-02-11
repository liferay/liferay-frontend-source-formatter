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

var sub = base.sub;

var Logger = require('./lib/logger');

var series = args.map(
	function(file) {
		return function(done) {
			var fileObj = new File(file);

			var formatter = Formatter.get(fileObj);

			if (formatter) {
				fileObj.format(formatter).then(function(data) {
					var config = {};

					if (FILE_NAMES) {
						if (RELATIVE) {
							config.relative = CWD;
						}

						Logger.renderFileNames(fileObj, config);
					}
					else {
						config.showBanner = QUIET;

						Logger.render(fileObj, config);
					}

					if (this.isDirty() && INLINE_REPLACE) {
						this.write().then(
							function(data) {
								console.log('Wrote file: %s', file);
							}
						).catch(this.handleFileWriteError);
					}

					done(null, data);
				})
				.error(fileObj.handleFileReadError)
				.catch(
					function(err) {
						console.error(('Something went wrong.\nDetails below:'.error) + '\n%s', err.stack);
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