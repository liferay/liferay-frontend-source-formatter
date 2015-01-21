var eslint = require('eslint');
var ESLINT_CONFIG = require('./eslint_config');
var glob = require('glob');
var path = require('path');

var base = require('./base');

var A = base.A;
var trackErr = base.trackErr;
var sub = base.sub;

var stubs = {};

A.Object.each(
	base.jspLintStubs,
	function(item, index) {
		stubs[item] = true;
	}
);

var RE_STUBS = new RegExp('^(' + Object.keys(stubs).join('|') + ')');

var esLintFormatter = function(results, config) {
	results.forEach(
		function(result, index) {
			result.messages.forEach(
				function(item, index) {
					trackErr(sub('Line: {0} {1} ({2})', (item.line || 0), item.message, (item.ruleId || 'n/a')).warn, result.filePath, (item.ruleId || item.message));
				}
			);
		}
	);
};

var customRules = {};

var convertNameToRuleId = function(item) {
	var baseName = path.basename(item, '.js');

	return 'csf-' + baseName.replace(/_/g, '-');
};

var runLinter = function(contents, file, customRules, config) {
	eslint.linter.defineRules(customRules);

	if (A.Lang.isObject(config)) {
		Object.keys(ESLINT_CONFIG).forEach(
			function(item, index) {
				var configItem = A.namespace.call(config, item);

				A.mix(configItem, ESLINT_CONFIG[item]);
			}
		);
	}
	else {
		config = ESLINT_CONFIG;
	}

	var results = [{filePath: file, messages: eslint.linter.verify(contents, ESLINT_CONFIG, file)}];

	esLintFormatter(results, ESLINT_CONFIG);
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file, config) {
	glob.sync(
		'./rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = convertNameToRuleId(item);

			customRules[id] = require(item);
		}
	);

	eslint.linter.defineRules(customRules);

	runLinter(contents, file, customRules, config);
};