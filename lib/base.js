var _ = require('lodash');
var colors = require('colors');

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

_.mixin(
	{
		bindKeyRight: function(context, key) {
			var args = _.toArray(arguments).slice(2);

			args.unshift(_.bindKey(context, key));

			return _.partialRight.apply(_, args);
		},

		bindRight: function(fn, context) {
			var args = _.toArray(arguments).slice(2);

			args.unshift(_.bind(fn, context));

			return _.partialRight.apply(_, args);
		}
	}
);

_.mixin(
	{
		namespace: function(obj, path) {
			if (arguments.length === 1) {
				path = obj;
				obj = this;
			}

			if (_.isString(path)) {
				path = path.split('.');
			}

			for (var i = 0; i < path.length; i++) {
				var name = path[i];

				obj[name] = obj[name] || {};
				obj = obj[name];
			}

			return obj;
		}
	},
	{
		chain: false
	}
);

module.exports = {
	CWD: process.env.GIT_PWD || process.cwd(),
	INDENT: '    ',

	iterateLines: iterateLines,
	jspLintStubs: jspLintStubs,
	stubs: stubs,
	sub: sub,
	theme: theme
};