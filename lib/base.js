var A = require('yui').use('yui-base', 'oop', 'array-extras');
var optimist = require('optimist').usage('Usage: $0 -qo')
			.options(
				{
					color: {
						boolean: true,
						default: true
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
					v: {
						alias: 'verbose',
						boolean: true,
						default: false
					}
				}
			);

var argv = optimist.argv;

var fileErrors = {};

var testStats = {
	failures: 0
};

var trackErr = function(err, file, type) {
	var errors = fileErrors[file];

	testStats.failures++;

	if (!errors) {
		errors = [];

		fileErrors[file] = errors;
	}

	errors.push(
		{
			err: err,
			type: type
		}
	);
};

var REGEX_SUB = /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g;

var sub = function(str, obj) {
	var objType = typeof obj;

	if (objType !== 'object' && objType !== 'function') {
		obj = Array.prototype.slice.call(arguments, 1);
	}

	if (str.replace) {
		str = str.replace(
			REGEX_SUB,
			function(match, key) {
				return (typeof obj[key] !== 'undefined') ? obj[key] : match;
			}
		);
	}

	return str;
};

var iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

module.exports = {
	A: A,
	INDENT: '    ',

	argv: argv,
	fileErrors: fileErrors,
	iterateLines: iterateLines,
	jspLintStubs: {
		scriptlet: '_SCRIPTLET_',
		echoScriptlet: '_ECHO_SCRIPTLET',
		namespace: '_PN_',
		elExpression: '_EL_EXPRESSION_'
	},
	optimist: optimist,
	sub: sub,
	testStats: testStats,
	trackErr: trackErr
};