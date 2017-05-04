var _ = require('lodash');
var base = require('./base');
var re = require('./re');
var Promise = require('bluebird');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

var REGEX_STYLELINT_POSTFIX = / \(.+?\)$/

Formatter.CSS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.[^.]+$/,
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			format: function(contents, lint) {
				var instance = this;

				var logger = this.log.bind(this);

				var newContents = iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);

				var context = {
					file: this.file,
					lintConfig: this.flags.lint !== false && lint
				};

				return this._lint(contents, context).then(
					function(results) {
						instance._logLintResults(results.results);

						return newContents;
					}
				).catch(
					function(err) {
						instance.log(
							'N/A',
							'Could not parse the file because of ' + err,
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

			formatPropertyItem: function(content) {
				return content.replace(REGEX.LEADING_SPACE, '').replace(REGEX.LEADING_INCLUDE, '');
			},

			processFile: function(content, index, collection, logger) {
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

			processProperty: function(rawContent, content, nextItem, context) {
				var re = this._re;

				content = this.formatPropertyItem(content);

				var propertyContext = _.assign(
					{},
					context,
					{
						content: content
					}
				);

				rawContent = re.iterateRules('css._properties', propertyContext);

				return {
					content: content,
					rawContent: rawContent
				};
			},

			_getContext: function(content, index, collection, logger) {
				var context = {
					collection: collection,
					file: this.file
				};

				var lineNum = index + 1;
				var nextItem = collection[lineNum] && collection[lineNum].trim();
				var previousItem = null;

				if (index > 0) {
					previousItem = collection[index - 1];
					previousItem = previousItem && previousItem.trim();
				}

				var propertyRules = this._re.rules.css._properties;

				context.content = content;
				context.index = index;
				context.lineNum = lineNum;
				context.nextItem = nextItem;
				context.previousItem = previousItem;

				return context;
			},

			_lint: function(contents, context) {
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

			_logLintResults: function(results) {
				var instance = this;

				var lintLogFilter = instance.lintLogFilter;

				if (!_.isFunction(lintLogFilter)) {
					lintLogFilter = false;
				}

				results[0].warnings.forEach(
					function(item, index) {
						// item.text = item.text.replace(REGEX_STYLELINT_POSTFIX, '');

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