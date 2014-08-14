var A = require('yui').use('yui-base', 'oop', 'array-extras');
var argv = require('optimist').usage('Usage: $0 -qo')
			.options(
				{
					color: {
						boolean: true,
						default: true
					},
					i: {
						alias: 'inline-edit',
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
					v: {
						alias: 'verbose',
						boolean: true,
						default: false
					},
					m: {
						alias: 'check-metadata',
						boolean: true,
						default: false
					}
				}
			).argv;

module.exports = {
	A: A,
	argv: argv,
	INDENT: '    '
};