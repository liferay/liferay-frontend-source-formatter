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

var needsModuleVerification = false;
var liferayModuleDir = null;

var isPrivate = function(str) {
	return A.Lang.isString(str) && str.charAt(0) === '_';
};

var LIFECYCLE_METHODS = {
	init: -1100,
	initializer: -1000,
	renderUI: -900,
	bindUI: -800,
	syncUI: -700,
	destructor: -600
};

var jsonf = A.rbind(
	'stringify',
	JSON,
	function(key, value) {
		if (key == 'start' || key == 'end') {
			return value.line;
		}
		if (['parent', 'range'].indexOf(key) == -1) {
			return value;
		}
	},
	4
);

var getLineBounds = function(loc, prop) {
	var val = {};

	if (loc) {
		loc = loc.loc || loc;

		val.start = loc.start.line;
		val.end = loc.end.line;
	}

	if (prop) {
		val = val[prop];
	}

	return val;
};

var processor = {
	BlockStatement: function(node, parent, file) {
		var constants = [];

		node.body.forEach(
			function(item, index) {
				if (item.type == 'VariableDeclaration' && item.declarations) {
					item.declarations.forEach(
						function(val, key) {
							if (/^[A-Z0-9_]+$/.test(val.id.name)) {
								constants.push(val);
							}
						}
					);
				}
			}
		);

		var prevConstants = [];

		constants.forEach(
			function(item, index, coll) {
				var prev = coll[index - 1];

				var itemName = item.id.name;

				if (prev) {
					var loc = item.loc;
					var prevLoc = prev.loc;
					var itemStart = loc.start.line;
					var itemEnd = loc.end.line;
					var prevStart = prevLoc.start.line;
					var prevEnd = prevLoc.end.line;

					var diff = itemStart - prevEnd;

					var prevName = prev.id.name;

					if (diff < 2) {
						trackErr(sub('Line: {0} constants should be separated by a single new line', itemStart).warn, file);
					}
					else if (diff === 2 && prevName > itemName) {
						var re = new RegExp('\\b' + prevConstants.join('|') + '\\b');

						if (!re.test(item.source())) {
							trackErr(sub('Line: {0} Sort constants: {1} {2}', itemStart, prevName, itemName).warn, file);
						}
					}
				}

				prevConstants.push(itemName);
			}
		);
	},

	CallExpression: function(node, parent, file) {
		processor._processExpr(node, parent, file);
	},

	CatchClause: function(node, parent, file) {
		var instance = this;

		var start = node.loc.start.line;
		var shouldEnd = start + 1;
		var end = node.loc.end.line;

		if (!node.body.body.length && end != shouldEnd) {
			trackErr(sub('Line: {0} Empty catch statement should be closed on line {1}', start, shouldEnd).warn, file);
		}

		var paramName = node.param.name;

		if (paramName != 'e') {
			trackErr(sub('Line: {0} Catch statement param should be "e", not "{1}"', start, paramName).warn, file);
		}
	},

	_processArgs: function(args, options) {
		var obj = {};

		var fnStart = options.fnStart || 0;
		var fnEnd = options.fnEnd || 0;

		var multiLineFn = options.multiLineFn;

		var lastArgStartLine = 0;
		var lastArgEndLine = 0;

		var hasNonEmptyFunctionArg = false;
		var hasNonEmptyObjectArg = false;

		var testLineEndings = false;
		var argLineStarts = [];
		var argLineEnds = [];

		var error = '';

		args.forEach(
			function(item, index, collection) {
				var type = item.type;

				var loc = getLineBounds(item.loc);

				var argStart = loc.start;
				var argEnd = loc.end;

				argLineStarts.push(argStart);
				argLineEnds.push(argEnd);

				if (type == 'FunctionExpression' && item.body.body.length) {
					hasNonEmptyFunctionArg = true;
				}
				else if (type == 'ObjectExpression' && item.properties.length) {
					hasNonEmptyObjectArg = true;
				}

				if (multiLineFn) {
					if (argStart == fnStart) {
						error = 'Args should each be on their own line (args on start line)';
					}
					else if (argStart == fnStart || argEnd == fnEnd) {
						error = 'Args should each be on their own line (args on end line)';
					}
				}

				if (argStart == lastArgStartLine || argStart == lastArgEndLine) {
					testLineEndings = true;
				}

				lastArgStartLine = argStart;
				lastArgEndLine = argEnd;
			}
		);

		if (testLineEndings) {
			var argLines = argLineStarts.concat(argLineEnds);

			if (hasNonEmptyFunctionArg || hasNonEmptyObjectArg || A.Array.dedupe(argLines).length > 1) {
				error = 'Args should each be on their own line (args on same line)';
			}
			else if (multiLineFn) {
				error = 'Function call can be all on one line';
			}
		}

		obj.error = error;

		return obj;
	},

	_processExpr: function(node, parent, file) {
		var callee = node.callee;

		var args = node.arguments;

		var lineBounds = getLineBounds(node);

		var fnStart = lineBounds.start;
		var fnEnd = lineBounds.end;

		var fnName = callee.name;

		var type = callee.type;

		if (type == 'FunctionExpression') {
			if (!fnName) {
				fnName = '<anonymous>';
			}

			fnStart = fnEnd = getLineBounds(node, 'end');

			if (args.length) {
				args.forEach(
					function(item, index) {
						fnStart = item.loc.start.line;
						fnEnd = item.loc.end.line;
					}
				);
			}
		}
		else if (type == 'MemberExpression') {
			fnEnd = getLineBounds(node, 'end');
			fnStart = getLineBounds(callee, 'end');

			if (!fnName && callee.property) {
				fnName = callee.property.name;
			}

			if (!fnName && callee.object.callee) {
				fnName = callee.object.callee.name;
			}
		}

		var multiLineFn = (fnEnd > fnStart);

		if (args.length) {
			var obj = processor._processArgs(
				args,
				{
					fnEnd: fnEnd,
					fnStart: fnStart,
					multiLineFn: multiLineFn
				}
			);

			var error = obj.error;

			if (error) {
				var lines = A.Array.dedupe([fnStart, fnEnd]);

				var lineText = lines.length > 1 ? 'Lines' : 'Line';

				trackErr(sub('{0}: {1} {2}: {3}(...)', lineText, lines.join('-'), error, fnName).warn, file);
			}
		}
		else if (multiLineFn) {
			trackErr(sub('Lines: {0} Function call without arguments should be on one line: {1}()', [fnStart, fnEnd].join('-'), fnName).warn, file);
		}
	}
};

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
				var instance = this;

				var fileDir = path.dirname(path.resolve(file));

				if (CHECK_META && !needsModuleVerification && path.basename(fileDir) === 'liferay' && fs.existsSync(path.join(fileDir, 'modules.js'))) {
					Formatter.JS.needsModuleVerification = true;
					Formatter.JS.liferayModuleDir = fileDir;
				}
			},

			_hasSheBang: function(contents) {
				return contents && contents[0] === '#' && contents[1] === '!';
			},

			_lint: function(contents, file, lint) {
				var instance = this;

				if (lint !== false) {
					var linter = require('./lint');

					linter(contents, file, lint);
				}
			},

			_processSyntax: function(contents, file) {
				var instance = this;

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