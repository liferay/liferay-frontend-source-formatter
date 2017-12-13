var _ = require('lodash');
var Promise = require('bluebird');

var base = require('./base');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;

var REGEX_STYLELINT_POSTFIX = / \(.+?\)$/;

Formatter.CSS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.[^.]+$/,
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			format(contents, lint) {
				var instance = this;

				var logger = this.log.bind(this);

				var newContents = iterateLines(
					contents,
					(item, index, collection) => instance.processFile(item, index, collection, logger)
				);

				var fix = this.flags.inlineEdit;

				var context = {
					file: this.file,
					fix,
					lintConfig: this.flags.lint !== false && lint
				};

				return this._lint(contents, context).then(
					results => {
						instance._logLintResults(results.results);

						return fix ? results.output : newContents;
					}
				).catch(
					err => {
						instance.log(
							'N/A',
							`Could not parse the file because of ${err}`,
							'stylelint-error',
							{
								column: 0,
								ruleId: 'stylelint-error'
							}
						);

						return newContents;
					}
				);
			},

			formatPropertyItem(content) {
				return content.replace(REGEX.LEADING_SPACE, '').replace(REGEX.LEADING_INCLUDE, '');
			},

			processFile(content, index, collection, logger) {
				var re = this._re;

				var rawContent = content;

				content = content.trim();

				re.hasExtraNewLines(content, index, collection);

				var context = this._getContext(content, index, collection, logger);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('common', context);

				content = context.content = rawContent.trim();

				if (re.hasProperty(content)) {
					var processed = this.processProperty(rawContent, content, context.nextItem, context);

					content = processed.content;
					rawContent = processed.rawContent;
				}

				context.content = content;
				context.rawContent = rawContent;

				rawContent = re.iterateRules('css', context);

				content = rawContent.trim();

				return rawContent;
			},

			processProperty(rawContent, content, nextItem, context) {
				var re = this._re;

				content = this.formatPropertyItem(content);

				var propertyContext = _.assign(
					{},
					context,
					{
						content
					}
				);

				rawContent = re.iterateRules('css._properties', propertyContext);

				return {
					content,
					rawContent
				};
			},

			_getContext(content, index, collection, logger) {
				var context = {
					collection,
					file: this.file
				};

				var lineNum = index + 1;
				var nextItem = collection[lineNum] && collection[lineNum].trim();
				var previousItem = null;

				if (index > 0) {
					previousItem = collection[index - 1];
					previousItem = previousItem && previousItem.trim();
				}

				context.content = content;
				context.index = index;
				context.lineNum = lineNum;
				context.nextItem = nextItem;
				context.previousItem = previousItem;

				return context;
			},

			_lint(contents, context) {
				var lint = context.lintConfig;

				var results = Promise.resolve(
					{
						results: [
							{
								warnings: []
							}
						]
					}
				);

				if (lint !== false) {
					var linter = require('./lint_css');

					lint = _.isObjectLike(lint) ? lint : {};

					context.lintConfig = _.merge(lint, this.config('css.lint'));

					results = linter(contents, this.file, context);
				}

				return results;
			},

			_logLintResults(results) {
				var instance = this;

				var lintLogFilter = instance.lintLogFilter;

				if (!_.isFunction(lintLogFilter)) {
					lintLogFilter = false;
				}

				results[0].warnings.forEach(
					(item, index) => {
						item.text = item.text.replace(REGEX_STYLELINT_POSTFIX, '');

						if (lintLogFilter) {
							item = lintLogFilter(item);
						}

						instance.log(
							item.line,
							item.text,
							item.rule,
							{
								column: item.column,
								ruleId: item.rule
							}
						);
					}
				);
			}
		}
	}
);

module.exports = Formatter.CSS;