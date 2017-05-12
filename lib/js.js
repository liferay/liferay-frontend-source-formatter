var _ = require('lodash');

var base = require('./base');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

/* istanbul ignore next */
var jsonf = _.bindKeyRight(
	JSON,
	'stringify',
	(key, value) => {
		var retVal;

		if (key === 'start' || key === 'end') {
			retVal = value.line;
		}
		else if (['parent', 'range'].indexOf(key) === -1) {
			retVal = value;
		}

		return retVal;
	},
	4
);

Formatter.JS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.js$/,
		id: 'js',
		includes: /\.js$/,
		prototype: {
			init() {
				this.processor = {};
			},

			format(contents, lint) {
				var hasSheBang = this._hasSheBang(contents);

				if (hasSheBang) {
					contents = `//${contents}`;
				}

				var filePath = this.file;

				var re = this._re;

				var context = {
					customIgnore: re.rules.js.IGNORE,
					file: filePath,
					fileConfig: this._config,
					hasSheBang,
					lintConfig: this.flags.lint !== false && lint
				};

				contents = this._lint(contents, context);

				if (this.flags.verbose) {
					this._processSyntax(contents);
				}

				if (hasSheBang) {
					contents = contents.substr(2, contents.length);
				}

				var newContents = iterateLines(
					contents,
					(content, index, collection) => {
						var rawContent = content;

						content = content.trim();

						re.hasExtraNewLines(content, index, collection);

						var lineNum = index + 1;

						context.content = content;
						context.lineNum = lineNum;
						context.nextItem = collection[lineNum] && collection[lineNum].trim();
						context.rawContent = rawContent;

						rawContent = re.iterateRules('common', context);

						content = context.content = rawContent.trim();

						context.rawContent = rawContent;

						rawContent = re.iterateRules('js', context);

						content = context.content = rawContent.trim();

						return rawContent;
					}
				);

				return newContents;
			},

			_hasSheBang(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_lint(contents, context) {
				var lint = context.lintConfig;

				if (lint !== false) {
					var linter = require('./lint_js');

					lint = _.isObjectLike(lint) ? lint : {};

					context.lintConfig = _.merge(lint, this.config('js.lint'));

					var lintResults = linter(contents, this.file, context);

					var results = lintResults.results;

					if (results.length) {
						this._logLintResults(results);

						contents = lintResults.contents;
					}
				}

				return contents;
			},

			_logLintResults(results) {
				var instance = this;

				var lintLogFilter = instance.lintLogFilter;

				if (!_.isFunction(lintLogFilter)) {
					lintLogFilter = false;
				}

				results.forEach(
					(item, index) => {
						if (lintLogFilter) {
							item = lintLogFilter(item);
						}

						instance.log(
							item.line,
							item.message,
							item.ruleId,
							{
								column: item.column,
								ruleId: item.ruleId
							}
						);
					}
				);
			},

			_printAsSource(contents) {
				return contents.split(REGEX.NEWLINE).map(
					(item, index) => `${index + 1} ${item}`
				).join('\n');
			},

			_processSyntax(contents) {
				var instance = this;

				try {
					var falafel = require('falafel');

					contents = falafel(
						contents,
						{
							loc: true,
							tolerant: true
						},
						node => {
							var parent = node.parent;
							var type = node.type;

							var processor = instance.processor;

							var processorFn = processor[type];

							if (_.isFunction(processorFn)) {
								processorFn.call(instance, node, parent);
							}
						}
					).toString();
				}
				catch (e) {
					this.log(e.lineNumber || 'n/a', sub('Could not parse JavaScript: {0}', e.description || e.message));

					this.logger.verboseDetails[this.file] = this._printAsSource(contents);
				}
			}
		}
	}
);

module.exports = Formatter.JS;