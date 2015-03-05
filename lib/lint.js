var _ = require('lodash');
var eslint = require('eslint');
var ESLINT_CONFIG = require('./eslint_config');
var glob = require('glob');
var path = require('path');

var customRules = {};

var convertNameToRuleId = function(item) {
	var baseName = path.basename(item, '.js');

	return 'csf-' + baseName.replace(/_/g, '-');
};

var runLinter = function(contents, file, customRules, config) {
	eslint.linter.defineRules(customRules);

	if (_.isObject(config)) {
		Object.keys(ESLINT_CONFIG).forEach(
			function(item, index) {
				var configItem = _.namespace(config, item);

				_.defaults(configItem, ESLINT_CONFIG[item]);
			}
		);
	}
	else {
		config = ESLINT_CONFIG;
	}

	return eslint.linter.verify(contents, config, file);
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file, config) {
	glob.sync(
		'./lint_rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = convertNameToRuleId(item);

			customRules[id] = require(item);
		}
	);

	eslint.linter.defineRules(customRules);

	return runLinter(contents, file, customRules, config);
};

module.exports.convertNameToRuleId = convertNameToRuleId;
module.exports.eslint = eslint;
module.exports.linter = eslint.linter;
module.exports.runLinter = runLinter;