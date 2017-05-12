'use strict';

var _ = require('lodash');
var Handlebars = require('content-logger-handlebars-helpers')();
var path = require('path');
var Promise = require('bluebird');

var fs = Promise.promisifyAll(require('fs'));

var Logger = require('./logger');

class JUnitReporter {
	constructor(config) {
		this.flags = config.flags || {};
		this.logger = config.logger || Logger;
		this.read = config.read || fs.readFileAsync.bind(fs);
		this.write = config.write || fs.writeFileAsync.bind(fs);
	}

	generate() {
		return this.read(this.TPL_PATH, 'utf-8').then(this.onRead.bind(this));
	}

	getContext() {
		const flags = this.flags;
		const logger = this.logger;

		const fileErrors = logger.getErrors();
		const testStats = logger.testStats;

		const result = {
			files: [],
			showLintIds: flags['lint-ids'],
			stats: testStats
		};

		_.forEach(
			fileErrors,
			(fileErrors, fileName) => {
				const errors = [];

				fileErrors = _.reject(
					fileErrors,
					{
						type: 'ignored'
					}
				);

				_.forEach(
					_.groupBy(fileErrors, 'type'),
					(violations, violationType) => {
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

				const fileResult = {
					errors,
					file: fileName,
					stats: {
						failures: fileErrors.length
					}
				};

				result.files.push(fileResult);
			}
		);

		return result;
	}

	getOutputPath() {
		let outputPath = this.flags.junit;

		if (!_.isString(outputPath)) {
			outputPath = 'result.xml';
		}

		return outputPath;
	}

	onRead(result) {
		const context = this.getContext();
		const outputPath = this.getOutputPath();

		const xml = this.renderTPL(result, context);

		return this.write(outputPath, xml);
	}

	renderTPL(tpl, context) {
		const xmlTpl = Handlebars.compile(tpl);

		return xmlTpl(context);
	}
}

JUnitReporter.prototype.TPL_PATH = path.join(__dirname, 'tpl', 'junit_report.tpl');

module.exports = JUnitReporter;