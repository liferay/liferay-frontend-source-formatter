var optimist = require('optimist')
			.usage('Usage: $0 -qo')
			.options(
				{
					'display-raw': {
						boolean: true,
						default: false
					},
					f: {
						alias: 'force',
						boolean: true,
						default: false
					},
					filenames: {
						boolean: true,
						default: false
					},
					h: {
						alias: 'help',
						boolean: true,
						default: false
					},
					i: {
						alias: 'inline-edit',
						boolean: true,
						default: false
					},
					l: {
						alias: 'lint',
						boolean: true,
						default: true
					},
					'lint-ids': {
						boolean: true,
						default: false
					},
					m: {
						alias: 'check-metadata',
						boolean: true,
						default: false
					},
					o: {
						alias: 'open',
						boolean: true,
						default: false
					},
					q: {
						alias: 'quiet',
						boolean: true,
						default: false
					},
					r: {
						alias: 'relative',
						boolean: true,
						default: false
					},
					'show-columns': {
						boolean: true,
						default: false
					},
					v: {
						alias: 'verbose',
						boolean: true,
						default: false
					},
					V: {
						alias: 'version',
						boolean: true,
						default: false
					}
				}
			);

var argv = optimist.argv;

/* istanbul ignore next */
if (argv.h || argv.V) {
	if (argv.h) {
		optimist.showHelp();
	}
	else if (argv.V) {
		console.log(require('../package.json').version);
	}

	process.exit();
}

module.exports = argv;