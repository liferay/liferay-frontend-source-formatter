var falafel = require('falafel');
var fs = require('fs');
var path = require('path');

var argv = require('./argv');
var base = require('./base');
var re = require('./re');

var Formatter = require('./formatter_base');

var A = base.A;

var iterateLines = base.iterateLines;
var sub = base.sub;

var iterateRules = re.iterateRules;

var CHECK_META = argv.m;
var LINT = argv.l;
var VERBOSE = argv.v;

var jsonf = A.rbind(
	'stringify',
	JSON,
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

var processor = {};

Formatter.JS = Formatter.create(
	{
		extensions: '*.js',
		id: 'js',
		prototype: {
			format: function(contents, lint) {
				var hasSheBang = this._hasSheBang(contents);

				if (hasSheBang) {
					contents = '//' + contents;
				}

				this._checkMetaData();

				this._lint(contents, LINT !== false && lint);

				this._processSyntax(contents);

				if (hasSheBang) {
					contents = contents.substr(2, contents.length);
				}

				var filePath = this.file.path;

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

						fullItem = iterateRules('common', fullItem, context);

						item = context.item = fullItem.trim();

						fullItem = iterateRules('js', fullItem, context);

						item = context.item = fullItem.trim();

						return fullItem;
					}
				);
			},

			_checkMetaData: function() {
				var fileDir = path.dirname(path.resolve(this.file.path));

				if (CHECK_META && !Formatter.JS.needsModuleVerification && path.basename(fileDir) === 'liferay' && fs.existsSync(path.join(fileDir, 'modules.js'))) {
					Formatter.JS.needsModuleVerification = true;
					Formatter.JS.liferayModuleDir = fileDir;
				}
			},

			_hasSheBang: function(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_logLintResults: function(results) {
				var instance = this;

				results.forEach(
					function(item, index) {
						instance.log(
							item.line || 0,
							sub('{0} ({1})', item.message, (item.ruleId || 'n/a'))
						);
					}
				);
			},

			_lint: function(contents, lint) {
				if (lint !== false) {
					var linter = require('./lint');

					var results = linter(contents, this.file.path, lint);

					if (results.length) {
						this._logLintResults(results);
					}
				}
			},

			_processSyntax: function(contents) {
				try {
					contents = falafel(
						contents,
						{
							loc: true,
							tolerant: true
						},
						function(node) {
							var parent = node.parent;
							var type = node.type;

							var processorFn = processor[type];

							if (processorFn) {
								processorFn(node, parent);
							}
						}
					).toString();
				}
				catch (e) {
					this.log(e.lineNumber || 'n/a', sub('Could not parse JavaScript: {0}', e.description || e.message));

					if (VERBOSE) {
						console.log(
							contents.split('\n').map(
								function(item, index) {
									return (index + 1) + item;
								}
							).join('\n')
						);
					}
				}
			}
		}
	}
);

module.exports = Formatter.JS;