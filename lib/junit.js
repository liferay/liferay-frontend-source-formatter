var _ = require('lodash');
var fs = require('fs');
var Handlebars = require('handlebars');

var base = require('./base');
var Logger = require('./logger');

var A = base.A;

var JUnitReporter = function(config) {
	this.flags = config.flags || {};
	this.logger = config.logger || Logger;
	this.read = config.read || fs.readFile.bind(fs);
	this.write = config.write || fs.writeFile.bind(fs);
};

JUnitReporter.prototype = {
	TPL_PATH: __dirname + '/junit_report.tpl',

	generate: function(done) {
		this.read(this.TPL_PATH, 'utf-8', A.rbind(this.onRead, this, done));
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

		A.Object.each(
			fileErrors,
			function(fileErrors, fileName) {
				var errors = [];

				A.Object.each(
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

		if (!A.Lang.isString(outputPath)) {
			outputPath = 'result.xml';
		}

		return outputPath;
	},

	onRead: function(err, result, done) {
		var context = this.getContext();
		var outputPath = this.getOutputPath();

		var xml = this.renderTPL(result, context);

		this.write(outputPath, xml, done);
	},

	renderTPL: function(tpl, context) {
		var xmlTpl = Handlebars.compile(tpl);

		return xmlTpl(context);
	}
};

module.exports = JUnitReporter;