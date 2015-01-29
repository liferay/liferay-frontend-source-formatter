var _ = require('underscore');
var cli = require('cli');
var fs = require('fs');
var mustache = require('mustache');

var argv = require('./argv');
var base = require('./base');

var A = base.A;
var fileErrors = base.fileErrors;
var testStats = base.testStats;

module.exports = {
	generate: function(done) {
		fs.readFile(
			__dirname + '/junit_report.tpl',
			{
				encoding: 'utf-8'
			},
			function(err, tpl) {
				var result = {
					files: [],
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
											stack: violations.map(
												function(violation) {
													return violation.err;
												}
											).join('\n')
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

				var xml = mustache.render(tpl, result);

				var outputPath = argv.junit;

				if (!A.Lang.isString(outputPath)) {
					outputPath = 'result.xml';
				}

				fs.writeFile(outputPath, xml, done);
			}
		);
	}
};