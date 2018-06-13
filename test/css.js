var _ = require('lodash');
var chai = require('chai');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

var Promise = require('bluebird');

Promise.promisifyAll(fs);

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

		var testFile = function(filePath) {
			var cssFormatter = new Formatter.CSS(filePath, cssLogger);

			return fs.readFileAsync(filePath,'utf-8').then(
				function(contents) {
					var newContents = cssFormatter.format(contents);

					return Promise.all([contents, newContents]);
				}
			)
			.then(
				function(arr) {
					return [cssLogger.fileErrors[filePath]].concat(arr);
				}
			);
		};

		it(
			'should detect lower case hex codes',
			function() {
				return testFile(getFilePath('hex_lower_case.css')).spread(
					function(errors) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Expected "#fff" to be "#FFF"');
					}
				);
			}
		);

		it(
			'should detect redundant hex codes',
			function() {
				return testFile(getFilePath('hex_redundant.css')).spread(
					function(errors) {
						assert.equal(errors.length, 1);

						assert.startsWith(errors[0].msg, 'Expected "#FFFFFF" to be "#FFF"');
					}
				);
			}
		);

		it(
			'should detect invalid border resets',
			function() {
				return testFile(getFilePath('invalid_border_reset.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect invalid formatting in property rules',
			function() {
				return testFile(getFilePath('invalid_format.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect missing integers',
			function() {
				return testFile(getFilePath('missing_integer.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect missing spaces in list values',
			function() {
				return testFile(getFilePath('missing_list_values_space.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect missing newlines',
			function() {
				return testFile(getFilePath('missing_newlines.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect missing spaces in selectors',
			function() {
				return testFile(getFilePath('missing_selector_space.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.startsWith(errors[0].msg, 'Expected single space before "{"');
					}
				);
			}
		);

		it(
			'should detect needless quotes',
			function() {
				return testFile(getFilePath('needless_quotes.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect needless units',
			function() {
				return testFile(getFilePath('needless_unit.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should detect property sort',
			function() {
				return testFile(getFilePath('property_sort.css')).spread(
					function(errors, contents, newContents) {
						assert.startsWith(errors[0].msg, 'Expected background to come before padding');
					}
				);
			}
		);

		it(
			'should detect trailing commas in selectors',
			function() {
				return testFile(getFilePath('trailing_comma.css')).spread(
					function(errors, contents, newContents) {
						assert.isAbove(errors.length, 0);

						assert.startsWith(errors[0].msg, 'Trailing comma in selector');

						assert.notEqual(contents, newContents);
					}
				);
			}
		);

		it(
			'should use a custom lint log filter',
			function(done) {
				var testFilePath = path.join(__dirname, 'fixture', 'css', 'at_rule_empty_line.css');

				var source = fs.readFileSync(testFilePath, 'utf-8');

				var cssLoggerFilter = new Logger.constructor();
				var cssFormatterFilter = new Formatter.CSS(testFilePath, cssLoggerFilter);

				var lintLogFilter = sinon.stub().returnsArg(0);

				cssFormatterFilter.lintLogFilter = lintLogFilter;

				var result = cssFormatterFilter.format(source);

				Promise.resolve(result).then(
					function(result) {
						assert.isTrue(lintLogFilter.called);
					}
				).done(done);
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

			return _.result(_.find(errors, whereLine), 'msg') || '';
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

describe(
	'Formatter.CSS Lint',
	function() {
		'use strict';

		beforeEach(
			function() {
				sinon.createSandbox();
			}
		);

		afterEach(
			function() {
				sinon.restore();
			}
		);

		var lintConfig = require('../lib/config/stylelint');

		var testFilePath = path.join(__dirname, 'fixture', 'css', 'at_rule_empty_line.css');

		var cssLogger = new Logger.constructor();
		var cssFormatter = new Formatter.CSS(testFilePath, cssLogger);
		var source = fs.readFileSync(testFilePath, 'utf-8');

		var cssLint = function(contents, config, file) {
			return Promise.resolve(
				{
					results: [
						{
							warnings: [
								{
									line: 1,
									message: '',
									column: 0,
									ruleId: ''
								}
							]
						}
					]
				}
			);
		};

		var lint = require('../lib/lint_css');

		it(
			'should find at least one lint error',
			function(done) {
				var response = cssFormatter.format(source, true);

				Promise.resolve(response).then(
					function(results) {
						var cssErrors = cssLogger.getErrors(testFilePath);

						var foundLintErrors = _.reduce(
							cssErrors,
							function(res, item, index) {
								if (item.type) {
									res[item.type] = true;
								}

								return res;
							},
							{}
						);

						var hasLintError = _.some(
							lintConfig.rules,
							function(item, index) {
								var val = _.isArray(item) ? item[0] : item;

								return val !== false && foundLintErrors[index];
							}
						);

						assert.isTrue(hasLintError);
					}
				).done(done);
			}
		);

		it(
			'should be able to disable linting',
			function(done) {
				var testFilePath = path.join(__dirname, 'fixture', 'css', 'at_rule_empty_line.css');

				var source = fs.readFileSync(testFilePath, 'utf-8');

				var cssLoggerFilter = new Logger.constructor();
				var cssFormatterFilter = new Formatter.CSS(testFilePath, cssLoggerFilter);

				var result = cssFormatterFilter.format(source, false);

				Promise.resolve(result).then(
					function(result) {
						var errors = cssLoggerFilter.getErrors()[testFilePath] || [];

						var hasRuleId = errors.some(
							function(item, index) {
								return !!item.ruleId;
							}
						);

						assert.isFalse(hasRuleId);
						assert.equal(errors.length, 0);
					}
				).done(done);
			}
		);

		it(
			'should use default configuration properties',
			function() {
				var stylelint = lint.stylelint;

				sinon.stub(stylelint, 'lint').callsFake(cssLint);

				lint.runLinter(source, testFilePath, {});

				var args = stylelint.lint.args[0];

				assert.equal(args[0].config.rules['at-rule-no-vendor-prefix'], true);
			}
		);

		it(
			'should merge configuration properties',
			function() {

				var stylelint = lint.stylelint;

				sinon.stub(stylelint, 'lint').callsFake(cssLint);

				cssFormatter.format(
					source,
					{
						rules: {
							'at-rule-no-vendor-prefix': false
						}
					}
				);

				var args = stylelint.lint.args[0];

				assert.equal(args[0].config.rules['at-rule-no-vendor-prefix'], false);
			}
		);
	}
);