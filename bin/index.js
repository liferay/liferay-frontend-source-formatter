#!/bin/sh
":" //# http://sambal.org/?p=1014 ; exec /usr/bin/env node --harmony "$0" "$@"

var updateNotifier = require('update-notifier');

var notifier = updateNotifier(
	{
		pkg: require('../package.json')
	}
);

if (notifier.update) {
	notifier.notify();
}

require('../lib/cli').init();