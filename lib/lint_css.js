var _ = require('lodash');
var stylelint = require('stylelint');
var STYLELINT_CONFIG = require('./stylelint_config');
var glob = require('glob');
var path = require('path');

var customRules = {};

var reactRules = require('eslint-plugin-react').rules;

_.defaults(customRules, reactRules);

var convertNameToRuleId = function(item) {
	var baseName = path.basename(item, '.js');

	return 'csf-' + baseName.replace(/_/g, '-');
};

var runLinter = function(contents, file, customRules, config) {
	if (_.isObject(config)) {
		config = _.merge({}, STYLELINT_CONFIG, config);
	}
	else {
		config = STYLELINT_CONFIG;
	}

	console.log('====',config, file, contents);

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
			var id = convertNameToRuleId(item);

			customRules[id] = require(item);
		}
	);

	// stylelint.linter.defineRules(customRules);

	return runLinter(contents, file, customRules, config);
};

module.exports.convertNameToRuleId = convertNameToRuleId;
module.exports.stylelint = stylelint;
module.exports.linter = stylelint.linter;
module.exports.runLinter = runLinter;