var _ = require('underscore');
var cli = require('cli');
var fs = require('fs');
var mustache = require('mustache');

var base = require('./base');

var A = base.A;
var argv = base.argv;
var fileErrors = base.fileErrors;
var testStats = base.testStats;

module.exports = {
	generate: function(cb) {
		fs.readFile(__dirname + '/junit_report.tpl', { encoding: 'utf-8' },
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
										testName: violationType,
										failure: {
											msg: violationType,
											stack: violations.map(
												function(violation) {
													return violation.err;
												}
											).join('\n')
										}
									}
								);
							}
						);

						var fileResult = {
							errors: errors,
							file: fileName,
							stats: {
								failures: fileErrors.length,
							}
						};

						result.files.push(fileResult);
					}
				);

				var xml = mustache.render(tpl, result);

				fs.writeFile(argv.junit, xml, cb);
			}
		);
	}
}