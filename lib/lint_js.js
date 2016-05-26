var _ = require('lodash');
var eslint = require('eslint');
var SourceCodeFixer = require('eslint/lib/util/source-code-fixer');
var ESLINT_CONFIG = require('./config/eslint');
var glob = require('glob');
var path = require('path');

var ruleUtils = require('./rule_utils');

var customRules = {};

var reactRules = require('eslint-plugin-react').rules;

_.defaults(customRules, reactRules);

var loadPlugin = function(pluginName, configPath) {
	var rules;

	if (pluginName !== 'react') {
		if (pluginName.indexOf('eslint-plugin-') === -1) {
			pluginName = 'eslint-plugin-' + pluginName;
		}

		var baseName = pluginName.replace('eslint-plugin-', '');

		if (pluginName.indexOf('/') !== -1) {
			baseName = path.basename(baseName);

			if (configPath && !path.isAbsolute(pluginName)) {
				pluginName = path.resolve(configPath, pluginName);
			}
		}

		try {
			rules = require(pluginName).rules;
		}
		catch (e) {
		}

		if (rules) {
			rules = _.mapKeys(
				rules,
				function(item, index) {
					return baseName + '/' + index;
				}
			);

			eslint.linter.defineRules(rules);
		}
	}

	return rules;
};

var runLinter = function(contents, file, context) {
	var customRules = context.customRules || {};

	eslint.linter.defineRules(customRules);

	var config = context.lintConfig;

	// The ecmaVersion variable is undefined here if no config was found
	// But it's being used now for it's side effects
	// because we're defaulting the parser to es7 so it doesn't error out
	// but if it's specified in the config, we add the special
	// es6 lint rule set

	var ecmaVersion = _.get(config, 'parserOptions.ecmaVersion');

	var configs = [{}, ESLINT_CONFIG];

	if (ecmaVersion > 5) {
		var es6Config = require('./config/eslint_es6');

		configs.push(es6Config);
	}

	if (_.isObject(config)) {
		configs.push(config);
	}

	configs.push(
		function(objValue, srcValue, key) {
			var retVal;

			if (key === 'plugins' && _.isArray(objValue) && _.isArray(srcValue)) {
				retVal = objValue.concat(srcValue);
			}

			return retVal;
		}
	);

	config = _.mergeWith.apply(_, configs);

	if (config.plugins) {
		var configPath = _.get(context, 'fileConfig._paths.obj.filepath');

		if (configPath) {
			configPath = path.dirname(configPath);
		}

		config.plugins.forEach(
			function(item, index) {
				loadPlugin(item, configPath);
			}
		);
	}

	var results = eslint.linter.verify(contents, config, file);

	if (results.length) {
		var fixedContent = SourceCodeFixer.applyFixes(eslint.linter.getSourceCode(), results);

		if (fixedContent.fixed) {
			contents = fixedContent.output;
		}
	}

	return {
		contents: contents,
		results: results
	};
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file, context) {
	context.customRules = customRules;

	glob.sync(
		'./lint_js_rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = ruleUtils.getRuleId(item);

			customRules[id] = require(item);
		}
	);

	// eslint.linter.defineRules(customRules);

	return runLinter(contents, file, context);
};

module.exports.eslint = eslint;
module.exports.linter = eslint.linter;
module.exports.runLinter = runLinter;