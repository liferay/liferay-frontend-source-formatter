var _ = require('lodash');
var stylelint = require('stylelint');
var STYLELINT_CONFIG = require('./config/stylelint');
var glob = require('glob');
var path = require('path');

var ruleUtils = require('./rule_utils');

var runLinter = function(contents, file, config) {
	if (_.isObject(config)) {
		config = _.merge({}, STYLELINT_CONFIG, config);
	}
	else {
		config = STYLELINT_CONFIG;
	}

	return stylelint.lint(
		{
			code: contents,
			codeFileName: file,
			config: config,
			formatter: 'json',
			syntax: 'scss'
		}
	);
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file, config) {
	glob.sync(
		'./lint_css_rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = ruleUtils.getRuleId(item);

			stylelint.rules[id] = require(item);
		}
	);

	return runLinter(contents, file, config);
};

module.exports.stylelint = stylelint;
module.exports.linter = stylelint.linter;
module.exports.runLinter = runLinter;