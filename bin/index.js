#!/usr/bin/env node

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