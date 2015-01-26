var eslint = require('eslint');
var ESLINT_CONFIG = require('./eslint_config');
var glob = require('glob');
var path = require('path');

var base = require('./base');

var A = A;
var trackErr = base.trackErr;
var sub = base.sub;

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

var runLinter = function(contents, file, customRules) {
	eslint.linter.defineRules(customRules);

	var results = [{filePath: file, messages: eslint.linter.verify(contents, ESLINT_CONFIG, file)}];

	esLintFormatter(results, ESLINT_CONFIG);
};

var globOptions = {
	cwd: __dirname
};

module.exports = function(contents, file) {
	glob.sync(
		'./rules/*.js',
		globOptions
	).forEach(
		function(item, index) {
			var id = convertNameToRuleId(item);

			customRules[id] = require(item);
		}
	);

	runLinter(contents, file, customRules);
};