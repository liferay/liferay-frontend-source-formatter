var _ = require('lodash');

require('lodash-namespace')(_);
require('lodash-bindright')(_);

var REGEX_NEWLINE = /\r?\n/;

var iterateLines = (contents, iterator) => {
	var lines = contents.split(REGEX_NEWLINE);

	return lines.map(iterator).join('\n');
};

var jspLintStubs = {
	echoScriptlet: '_ECHO_SCRIPTLET',
	elExpression: '_EL_EXPRESSION_',
	namespace: '_PN_',
	scriptlet: '_SCRIPTLET_'
};

var stubs = _.transform(
	jspLintStubs,
	(result, item, index) => {
		result[item] = true;
	},
	{}
);

module.exports = {
	INDENT: '    ',
	REGEX_NEWLINE,

	iterateLines,
	jspLintStubs,
	stubs
};