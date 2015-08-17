var _ = require('lodash');

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
	stubs: stubs
};