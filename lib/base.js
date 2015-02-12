var A = require('yui').use('yui-base', 'oop', 'array-extras');
var colors = require('colors');

var argv = require('./argv');

var theme = {
	bgError: 'bgRed',
	bgHelp: 'bgCyan',
	bgSubtle: 'bgGrey',
	bgWarn: 'bgYellow',
	error: 'red',
	help: 'cyan',
	subtle: 'grey',
	warn: 'yellow'
};

colors.setTheme(theme);

if (!argv.color) {
	colors.mode = 'none';
}

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

var jspLintStubs = {
	scriptlet: '_SCRIPTLET_',
	echoScriptlet: '_ECHO_SCRIPTLET',
	namespace: '_PN_',
	elExpression: '_EL_EXPRESSION_'
};

var stubs = {};

A.Object.each(
	jspLintStubs,
	function(item, index) {
		stubs[item] = true;
	}
);

module.exports = {
	A: A,
	CWD: process.env.GIT_PWD || process.cwd(),
	INDENT: '    ',

	iterateLines: iterateLines,
	jspLintStubs: jspLintStubs,
	stubs: stubs,
	sub: sub,
	theme: theme
};