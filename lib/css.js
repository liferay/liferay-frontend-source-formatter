var _ = require('lodash');
var base = require('./base');
var re = require('./re');
var Promise = require('bluebird');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

Formatter.CSS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.[^.]+$/,
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			comparePropertySort: function(content, nextItem, context) {
				var re = this._re;

				var nextItemMatch;

				var contentMatch = content.match(REGEX.PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(REGEX.LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(REGEX.PROP_KEY);
				}

				if (contentMatch && nextItemMatch && contentMatch[1] > nextItemMatch[1]) {
					this.log(context.lineNum, sub('Sort: {0} {1}', content, nextItem));
				}

				return content;
			},

			format: function(contents) {
				var instance = this;

				var logger = this.log.bind(this);

				var newContents = iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);

				return this._lint(contents).then(function(results) {
					instance._logLintResults(results.results);

					return newContents;
				}).catch(
					function(err) {
						done(err, null);
					}
				);

				return contents;

				return ;
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

				content = this.comparePropertySort(content, nextItem, context);

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

			_lint: function(contents, lint) {
				var linter = require('./lint_css');

				var results = linter(contents, this.file, lint);

				return results;

				// results.then(function(results) {
				// 	console.log('promise', results);
				// })

				// if (results.length) {
				// 	this._logLintResults(results);
				// }
			},

			_logLintResults: function(results) {
				var instance = this;

				var lintLogFilter = instance.lintLogFilter;

				if (!_.isFunction(lintLogFilter)) {
					lintLogFilter = false;
				}

				results[0].warnings.forEach(
					function(item, index) {
						if (lintLogFilter) {
							item = lintLogFilter(item);
						}
/*{
  source:  "path/to/file.css", // The filepath or PostCSS identifier like <input css 1>
  errored: true, // This is `true` if at least one rule with an "error"-level severity triggered a warning
  warnings: [ // Array of rule violation warning objects, each like the following ...
    {
      line: 3,
      column: 12,
      rule: "block-no-empty",
      severity: "error",
      text: "You should not have an empty block (block-no-empty)"
    },
    ..
  ],
  deprecations: [ // Array of deprecation warning objects, each like the following ...
    {
      text: "Feature X has been deprecated and will be removed in the next major version.",
      reference: "http://stylelint.io/feature-x.md"
    }
  ],
  invalidOptionWarnings: [ // Array of invalid option warning objects, each like the following ...
    {
      text: "Invalid option X for rule Y",
    }
  ]
}*/

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