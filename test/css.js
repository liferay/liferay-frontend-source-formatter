var _ = require('lodash');
var chai = require('chai');
var fs = require('fs');
var path = require('path');

var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'Formatter.CSS',
	function() {
		'use strict';

		var cssLogger = new Logger.constructor();

		var cssTestsPath = path.join(__dirname, 'fixture', 'css');

		var getFilePath = path.join.bind(path, cssTestsPath);

		var testFile = function(filePath, cb, done) {
			var cssFormatter = new Formatter.CSS(filePath, cssLogger);

			fs.readFile(
				filePath,
				'utf-8',
				function(err, contents) {
					if (!err) {
						var newContents = cssFormatter.format(contents);

						cb(cssLogger.fileErrors[filePath], contents, newContents);
					}

					if (done) {
						done();
					}
				}
			);
		};

		it(
			'should detect lower case hex codes',
			function(done) {
				testFile(
					getFilePath('hex_lower_case.css'),
					function(errors) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Hex code should be all uppercase');
					},
					done
				);
			}
		);

		it(
			'should detect redundant hex codes',
			function(done) {
				testFile(
					getFilePath('hex_redundant.css'),
					function(errors) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Hex code can be reduced to');
					},
					done
				);
			}
		);

		it(
			'should detect invalid border resets',
			function(done) {
				testFile(
					getFilePath('invalid_border_reset.css'),
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						var borderErrors = errors.filter(
							function(item, index) {
								return item.line <= 11 && item.msg.indexOf('You should use "border-') === 0;
							}
						);

						assert.equal(borderErrors.length, errors.length);

						assert.notEqual(contents, newContents);
					},
					done
				);
			}
		);

		it(
			'should detect invalid formatting in property rules',
			function(done) {
				testFile(
					getFilePath('invalid_format.css'),
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						var formatErrors = errors.filter(
							function(item, index) {
								return item.line <= 3 && item.msg.indexOf('There should be one space after ":"') === 0;
							}
						);

						assert.equal(formatErrors.length, errors.length);
					},
					done
				);
			}
		);

		it(
			'should detect missing integers',
			function(done) {
				testFile(
					getFilePath('missing_integer.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Missing integer');
					},
					done
				);
			}
		);

		it(
			'should detect missing spaces in list values',
			function(done) {
				testFile(
					getFilePath('missing_list_values_space.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Needs space between comma-separated values');
					},
					done
				);
			}
		);

		it(
			'should detect missing newlines',
			function(done) {
				testFile(
					getFilePath('missing_newlines.css'),
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						var formatErrors = errors.filter(
							function(item, index) {
								return item.msg.indexOf('There should be a newline between') === 0;
							}
						);

						assert.equal(formatErrors.length, errors.length);
					},
					done
				);
			}
		);

		it(
			'should detect missing spaces in selectors',
			function(done) {
				testFile(
					getFilePath('missing_selector_space.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Missing space between selector and bracket');
					},
					done
				);
			}
		);

		it(
			'should detect needless quotes',
			function(done) {
				testFile(
					getFilePath('needless_quotes.css'),
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						var formatErrors = errors.filter(
							function(item, index) {
								return item.msg.indexOf('Needless quotes') === 0;
							}
						);

						assert.equal(formatErrors.length, errors.length);
					},
					done
				);
			}
		);

		it(
			'should detect needless units',
			function(done) {
				testFile(
					getFilePath('needless_unit.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Needless unit');
					},
					done
				);
			}
		);

		it(
			'should detect property sort',
			function(done) {
				testFile(
					getFilePath('property_sort.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Sort');
					},
					done
				);
			}
		);

		it(
			'should detect trailing commas in selectors',
			function(done) {
				testFile(
					getFilePath('trailing_comma.css'),
					function(errors, contents, newContents) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Trailing comma in selector');
					},
					done
				);
			}
		);
	}
);

describe(
	'Formatter.CSS Excludes',
	function() {
		'use strict';

		var getErrorMsgByLine = function(lineNum, errors) {
			var whereLine = {
				line: lineNum
			};

			return _.result(_.findWhere(errors, whereLine), 'msg') || '';
		};

		it(
			'should ignore excluded files',
			function() {
				_.forEach(
					['nocsf'],
					function(item, index) {
						['-', '_', '.'].forEach(
							function(n, i) {
								var testFilePath = 'test' + n + item + '.css';
								var logger = new Logger.constructor();
								var formatter = new Formatter.get(testFilePath, logger);

								var errors = logger.getErrors(testFilePath);

								assert.startsWith(getErrorMsgByLine('n/a', errors), 'This file was ignored.');
							}
						);
					}
				);
			}
		);
	}
);