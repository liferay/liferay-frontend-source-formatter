var _ = require('lodash');

var base = require('./base');
var re = require('./re');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

/* istanbul ignore next */
var jsonf = _.bindKeyRight(
	JSON,
	'stringify',
	function(key, value) {
		if (key === 'start' || key === 'end') {
			return value.line;
		}
		if (['parent', 'range'].indexOf(key) === -1) {
			return value;
		}
	},
	4
);

Formatter.JS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.js$/,
		id: 'js',
		includes: /\.js$/,
		prototype: {
			init: function() {
				this.processor = {};
			},

			format: function(contents, lint) {
				var hasSheBang = this._hasSheBang(contents);

				if (hasSheBang) {
					contents = '//' + contents;
				}

				this._lint(contents, this.flags.lint !== false && lint);

				if (this.flags.verbose) {
					this._processSyntax(contents);
				}

				if (hasSheBang) {
					contents = contents.substr(2, contents.length);
				}

				var filePath = this.file;

				var logger = this.log.bind(this);

				var re = this._re;

				return iterateLines(
					contents,
					function(content, index, collection) {
						var rawContent = content;

						content = content.trim();

						re.hasExtraNewLines(content, index, collection);

						var lineNum = index + 1;

						var context = {
							content: content,
							customIgnore: re.rules.js.IGNORE,
							file: filePath,
							hasSheBang: hasSheBang,
							lineNum: lineNum,
							nextItem: collection[lineNum] && collection[lineNum].trim(),
							rawContent: rawContent
						};

						rawContent = re.iterateRules('common', context);

						content = context.content = rawContent.trim();

						context.rawContent = rawContent;

						rawContent = re.iterateRules('js', context);

						content = context.content = rawContent.trim();

						return rawContent;
					}
				);
			},

			_hasSheBang: function(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_lint: function(contents, lint) {
				if (lint !== false) {
					var linter = require('./lint');

					var results = linter(contents, this.file, lint);

					if (results.length) {
						this._logLintResults(results);
					}
				}
			},

			_logLintResults: function(results) {
				var instance = this;

				var lintLogFilter = instance.lintLogFilter;

				if (!_.isFunction(lintLogFilter)) {
					lintLogFilter = false;
				}

				results.forEach(
					function(item, index) {
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

			_printAsSource: function(contents) {
				return contents.split('\n').map(
					function(item, index) {
						return (index + 1) + ' ' + item;
					}
				).join('\n');
			},

			_processSyntax: function(contents) {
				var instance = this;

				try {
					var falafel = require('falafel');

					contents = falafel(
						contents,
						{
							loc: true,
							tolerant: true
						},
						function(node) {
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