#!/usr/bin/env sh
":" //# http://sambal.org/?p=1014 ; exec /usr/bin/env node --harmony "$0" "$@"

var ConfigStore = require('configstore');
var updateNotifier = require('update-notifier');

var deprecationCheck = require('../lib/deprecation');

var pkg = require('../package.json');

var notifier = updateNotifier({pkg});

if (notifier.update) {
	notifier.notify();
}

var config = new ConfigStore(
	pkg.name,
	{
		lastPackageVersion: pkg.version,
		lastUpdateCheck: Date.now()
	}
);

var cli = require('../lib/cli').init().then(
	function() {
		var deprecated = deprecationCheck(
			{
				config,
				pkg,
				scriptName: process.argv[1]
			}
		);

		if (deprecated) {
			console.log(deprecated);
		}
	}
);