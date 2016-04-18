var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Handlebars = require('content-logger-handlebars-helpers')();
var path = require('path');

var base = require('./base');
var Logger = require('./logger');

var A = base.A;

var JUnitReporter = function(config) {
	this.flags = config.flags || {};
	this.logger = config.logger || Logger;
	this.read = config.read || fs.readFileAsync.bind(fs);
	this.write = config.write || fs.writeFileAsync.bind(fs);
};

JUnitReporter.prototype = {
	TPL_PATH: path.join(__dirname, 'tpl', 'junit_report.tpl'),

	generate: function() {
		return this.read(this.TPL_PATH, 'utf-8').then(this.onRead.bind(this));
	},

	getContext: function() {
		var flags = this.flags;
		var logger = this.logger;

		var fileErrors = logger.getErrors();
		var testStats = logger.testStats;

		var result = {
			files: [],
			showLintIds: flags['lint-ids'],
			stats: testStats
		};

		_.forEach(
			fileErrors,
			function(fileErrors, fileName) {
				var errors = [];

				fileErrors = _.reject(fileErrors, {type: 'ignored'});

				_.forEach(
					_.groupBy(fileErrors, 'type'),
					function(violations, violationType) {
						errors.push(
							{
								failure: {
									msg: violationType,
									stack: violations
								},
								testName: violationType
							}
						);
					}
				);

				var fileResult = {
					errors: errors,
					file: fileName,
					stats: {
						failures: fileErrors.length
					}
				};

				result.files.push(fileResult);
			}
		);

		return result;
	},

	getOutputPath: function() {
		var outputPath = this.flags.junit;

		if (!_.isString(outputPath)) {
			outputPath = 'result.xml';
		}

		return outputPath;
	},

	onRead: function(result) {
		var context = this.getContext();
		var outputPath = this.getOutputPath();

		var xml = this.renderTPL(result, context);

		return this.write(outputPath, xml);
	},

	renderTPL: function(tpl, context) {
		var xmlTpl = Handlebars.compile(tpl);

		return xmlTpl(context);
	}
};

module.exports = JUnitReporter;