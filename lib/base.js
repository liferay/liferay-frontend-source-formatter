var _ = require('lodash');

require('lodash-namespace')(_);
require('lodash-bindright')(_);

var iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

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
	CWD: process.env.GIT_PWD || process.cwd(),
	INDENT: '    ',

	iterateLines: iterateLines,
	jspLintStubs: jspLintStubs,
	stubs: stubs
};