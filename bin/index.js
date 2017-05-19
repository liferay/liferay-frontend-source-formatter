#!/bin/sh
":" //# http://sambal.org/?p=1014 ; exec /usr/bin/env node --harmony "$0" "$@"

var _ = require('lodash');
var colors = require('cli-color-keywords')();
var ConfigStore = require('configstore');
var path = require('path');
var updateNotifier = require('update-notifier');
var fs = require('fs');

const ONE_DAY = 1000 * 60 * 60 * 24;

var pkg = require('../package.json');

var notifier = updateNotifier({pkg});

if (notifier.update) {
	notifier.notify();
}

var cli = require('../lib/cli').init();

var config = new ConfigStore(
	pkg.name,
	{
		lastPackageVersion: pkg.version,
		lastUpdateCheck: Date.now()
	}
);

var lastUpdateCheck = config.get('lastUpdateCheck');

if (path.basename(process.argv[1]) === 'check_sf' && (Date.now() - lastUpdateCheck > ONE_DAY)) {
	var unindent = (strings, ...keys) => _.zipWith(strings, keys, _.add).join('').replace(/^\s+/gm, '  ');

	cli.then(
		function() {
			var header = `Using the ${colors.inverse('check_sf')} form of this module is deprecated.`;

			var footer = `Please use the ${colors.inverse('csf')} command instead. It's easier to type too!`;

			var maxLineLength = Math.max(header.length, footer.length);

			var bar = new Array(maxLineLength).join('-');

			console.log(unindent`${bar}
				${colors.error(header)}
				${colors.green(footer)}`);

			config.set('lastUpdateCheck', Date.now());
		}
	);
}