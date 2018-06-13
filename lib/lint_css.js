var _ = require('lodash');
var glob = require('glob');
var path = require('path');
var stylelint = require('stylelint');

var STYLELINT_CONFIG = require('./config/stylelint');

var ruleUtils = require('./rule_utils');

var customRules = {};

var rootDir = path.resolve(__dirname, '..');

var runLinter = (contents, file, context) => {
	var customRules = context.customRules || {};

	_.merge(stylelint.rules, customRules);

	// console.log(stylelint.rules);

	var config = context.lintConfig;

	var configs = [{}, STYLELINT_CONFIG];

	if (_.isObject(config)) {
		configs.push(config);
	}

	config = _.merge(...configs);

	return stylelint.lint(
		{
			code: contents,
			codeFileName: file,
			config,
			configBasedir: rootDir,
			formatter: 'json',
			fix: context.fix,
			syntax: 'scss'
		}
	);
};

var globOptions = {
	cwd: __dirname
};

module.exports = (contents, file, context) => {
	context.customRules = customRules;
	var plugins = STYLELINT_CONFIG.plugins;

	glob.sync(
		'./lint_css_rules/*.js',
		globOptions
	).forEach(
		(item, index) => {
			var id = ruleUtils.getRuleId(item);

			customRules[id] = require(item);

			plugins.push(path.resolve(rootDir, './lib', item));
		}
	);

	return runLinter(contents, file, context);
};

module.exports.stylelint = stylelint;
module.exports.linter = stylelint.linter;
module.exports.runLinter = runLinter;