var _ = require('lodash');

require('lodash-namespace')(_);
require('lodash-bindright')(_);

var REGEX_NEWLINE = /\r?\n/;

var iterateLines = function(contents, iterator) {
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
	function(result, item, index) {
		result[item] = true;
	},
	{}
);

module.exports = {
	INDENT: '    ',
	REGEX_NEWLINE: REGEX_NEWLINE,

	iterateLines: iterateLines,
	jspLintStubs: jspLintStubs,
	stubs: stubs
};