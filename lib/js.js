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
var trackErr = base.trackErr;

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
			format: function(contents, file, lint) {
				var hasSheBang = this._hasSheBang(contents);

				if (hasSheBang) {
					contents = '//' + contents;
				}

				this._checkMetaData(file);

				this._lint(contents, file, LINT !== false && lint);

				this._processSyntax(contents, file);

				if (hasSheBang) {
					contents = contents.substr(2, contents.length);
				}

				return iterateLines(
					contents,
					function(item, index, collection) {
						var fullItem = item;

						item = item.trim();

						re.hasExtraNewLines(item, index, collection, file);

						var lineNum = index + 1;

						var context = {
							customIgnore: re.js.IGNORE,
							file: file,
							hasSheBang: hasSheBang,
							item: item,
							lineNum: lineNum,
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

			_checkMetaData: function(file) {
				var fileDir = path.dirname(path.resolve(file));

				if (CHECK_META && !Formatter.JS.needsModuleVerification && path.basename(fileDir) === 'liferay' && fs.existsSync(path.join(fileDir, 'modules.js'))) {
					Formatter.JS.needsModuleVerification = true;
					Formatter.JS.liferayModuleDir = fileDir;
				}
			},

			_hasSheBang: function(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_lint: function(contents, file, lint) {
				if (lint !== false) {
					var linter = require('./lint');

					linter(contents, file, lint);
				}
			},

			_processSyntax: function(contents, file) {
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
								processorFn(node, parent, file);
							}
						}
					).toString();
				}
				catch (e) {
					trackErr(sub('Line: {0} Could not parse JavaScript: {1}', e.lineNumber || 'n/a;', e.message).warn, file);

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