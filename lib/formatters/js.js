var _ = require('lodash');

var base = require('../base');
var re = require('../re');

var Formatter = require('../formatter_base');

var iterateLines = base.iterateLines;
var sub = base.sub;

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
		extensions: /\.js$/,
		excludes: /[_.-]min\.js$/,
		id: 'js',
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

				return iterateLines(
					contents,
					function(item, index, collection) {
						var fullItem = item;

						item = item.trim();

						re.hasExtraNewLines(item, index, collection, logger);

						var lineNum = index + 1;

						var context = {
							customIgnore: re.js.IGNORE,
							file: filePath,
							hasSheBang: hasSheBang,
							item: item,
							lineNum: lineNum,
							logger: logger,
							nextItem: collection[lineNum] && collection[lineNum].trim()
						};

						fullItem = re.iterateRules('common', fullItem, context);

						item = context.item = fullItem.trim();

						fullItem = re.iterateRules('js', fullItem, context);

						item = context.item = fullItem.trim();

						return fullItem;
					}
				);
			},

			_hasSheBang: function(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_lint: function(contents, lint) {
				if (lint !== false) {
					var linter = require('../lint');

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