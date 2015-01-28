var falafel = require('falafel');
var fs = require('fs');
var path = require('path');

var base = require('./base');
var re = require('./re');

var A = base.A;

var argv = base.argv;
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

var testVarNames = function(varName, lineNum, file) {
	var pass = true;

	if (re.REGEX_VAR_IS.test(varName)) {
		trackErr(sub('Line: {0} Variable/property names should not start with is*: {1}', lineNum, varName).warn, file);
		pass = false;
	}

	return pass;
};

var naturalCompare = function(a, b, caseInsensitive) {
	var result;

	if (A.Lang.isNumber(a) && A.Lang.isNumber(b)) {
		result = (a - b);
	}
	else {
		if (caseInsensitive === true) {
			a = a.toLowerCase();
			b = b.toLowerCase();
		}

		var aa = a.split(re.REGEX_DIGITS);
		var bb = b.split(re.REGEX_DIGITS);

		var length = Math.max(aa.length, bb.length);

		result = 0;

		for (var i = 0; i < length; i++) {
			var itemA = aa[i];
			var itemB = bb[i];

			if (itemA != itemB) {
				var cmp1 = parseInt(itemA, 10);
				var cmp2 = parseInt(itemB, 10);

				if (isNaN(cmp1)) {
					cmp1 = itemA;
				}

				if (isNaN(cmp2)) {
					cmp2 = itemB;
				}

				if (typeof cmp1 == 'undefined' || typeof cmp2 == 'undefined') {
					result = aa.length - bb.length;
				}
				else {
					result = cmp1 < cmp2 ? -1 : 1;
				}

				break;
			}
		}
	}

	return result;
};

var naturalSort = function(arr, caseInsensitive) {
	return arr.sort(
		function(a, b) {
			return naturalCompare(a, b, caseInsensitive);
		}
	);
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

	FunctionExpression: function(node, parent, file) {
		node.params.forEach(
			function(item, index) {
				testVarNames(item.name, item.loc.start.line, file);
			}
		);
	},

	ObjectExpression: function(node, parent, file) {
		var prev = null;
		var collection = node._col;

		if (!collection) {
			return;
		}

		collection.forEach(
			function(item, index, collection) {
				var parentValue = item.parent.value;
				var parentValueType = parentValue.type;

				var parentPropValueFn = (parentValueType == 'FunctionExpression');

				if (!parentPropValueFn) {
					var propValueMemberExp = (parentValueType == 'MemberExpression');
					var propValueIdentifier = (parentValueType == 'Identifier');

					var processVars = true;

					if (propValueMemberExp || propValueIdentifier) {
						var valName = parentValue.name;

						if (propValueMemberExp) {
							valName = parentValue.property.name;
						}

						processVars = (valName !== item.name) && !(re.REGEX_LANG_EMPTYFN.test(parentValue.source()));
					}

					if (processVars) {
						testVarNames(item.name, item.loc.start.line, file);
					}
				}

				if (index > 0) {
					var needsSort = false;

					var propName = item.name || item.value;
					var prevPropName = prev.name || prev.value;

					var privateProp = isPrivate(propName);
					var privatePrevProp = isPrivate(prevPropName);

					var propValueFn = (item.parent.value.type == 'FunctionExpression');
					var prevPropValueFn = (prev.parent.value.type == 'FunctionExpression');

					var lifecyleMethod = (LIFECYCLE_METHODS.hasOwnProperty(propName) || LIFECYCLE_METHODS.hasOwnProperty(prevPropName));

					var prevPropUpperCase = /^[^a-z]+$/.test(prevPropName);
					var propUpperCase = /^[^a-z]+$/.test(propName);

					if (lifecyleMethod) {
						var customPropName = LIFECYCLE_METHODS[propName];
						var customPrevPropName = LIFECYCLE_METHODS[prevPropName];

						if (customPropName) {
							if (customPrevPropName) {
								needsSort = customPropName < customPrevPropName;
							}
							else {
								needsSort = (!prevPropUpperCase && prevPropValueFn);
							}
						}
					}
					else {
						needsSort = (privateProp === privatePrevProp) && (propUpperCase === prevPropUpperCase) && naturalCompare(propName, prevPropName, true) === -1 && prevPropValueFn === propValueFn;
					}

					if (re.REGEX_SERVICE_PROPS.test(propName) || re.REGEX_SERVICE_PROPS.test(prevPropName)) {
						needsSort = false;
					}

					if (needsSort) {
						var note = lifecyleMethod ? '(Lifecycle methods should come first)' : '';

						trackErr(sub('Line: {0} Sort properties: {1} {2} {3}', item.loc.start.line, prevPropName, propName, note).warn, file);
					}
				}

				prev = item;
			}
		);

		delete node._col;
	},

	VariableDeclaration: function(node, parent, file) {
		var declarations = node.declarations;

		if (declarations.length > 1) {
			var lines = [];
			var low = declarations[0].loc.start.line;
			var high = low;

			var vars = declarations.map(
				function(item, index, collection) {
					var line = item.loc.start.line;

					if (line > high) {
						high = line;
					}
					else if (line < low) {
						low = line;
					}

					return item.id.name;
				}
			);

			lines.push(low);

			if (low !== high) {
				lines.push(high);
			}

			var lineText = lines.length > 1 ? 'Lines' : 'Line';

			trackErr(sub('{0}: {1} Each variable should have it\'s own var statement: {2}', lineText, lines.join('-'), vars.join(', ')).warn, file);
		}

		declarations.forEach(
			function(item, index) {
				var init = item.init;

				if (init) {
					var itemType = init.type;

					if (itemType !== 'FunctionExpression') {
						var varName = item.id.name;

						var process = true;

						if (itemType === 'MemberExpression' && init.property.name == varName) {
							process = false;
						}

						if (process) {
							testVarNames(varName, item.id.loc.start.line, file);
						}
					}
				}
			}
		);
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

var checkJs = function(contents, file, lint) {
	var hasSheBang = false;

	if (contents[0] === '#' && contents[1] === '!') {
		contents = '//' + contents;

		hasSheBang = true;
	}

	var fileDir = path.dirname(path.resolve(file));

	if (CHECK_META && !needsModuleVerification && path.basename(fileDir) === 'liferay' && fs.existsSync(path.join(fileDir, 'modules.js'))) {
		checkJs.needsModuleVerification = true;
		checkJs.liferayModuleDir = fileDir;
	}

	if (lint !== false && LINT !== false) {
		var linter = require('./lint');

		linter(contents, file);
	}

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

				// Check for trailing commas
				if (/(Object|Array)Expression/.test(type)) {
					var source = node.source();

					var leadingComma = re.REGEX_COMMA_LEADING.test(source);
					var trailingComma = re.REGEX_COMMA_TRAILING.test(source);

					var start = node.loc.start.line;
					var end = node.loc.end.line;

					var lineEnd = end;
					var lineStart = start;

					if (start === end) {
						if (re.REGEX_ARRAY_SURROUNDING_SPACE.test(source)) {
							var brackets = [];
							var surroundingSpaceTypes = [];

							source.replace(
								re.REGEX_ARRAY_SURROUNDING_SPACE,
								function(item, index, str) {
									var startIndex = 0;
									var endIndex = str.length;

									var leadingSpace = item.indexOf('[') > -1;
									var trailingSpace = item.indexOf(']') > -1;

									if (leadingSpace) {
										endIndex = index + 1;
										surroundingSpaceTypes.push('leading');
									}
									else if (trailingSpace) {
										startIndex = index + 1;
										surroundingSpaceTypes.push('trailing');
										brackets.push('...');
									}

									brackets.push(str.substring(startIndex, endIndex));

									if (leadingSpace) {
										brackets.push('...');
									}
								}
							);

							brackets = A.Array.dedupe(brackets);

							trackErr(sub('Line: {0} Remove {1} spaces: {2}', lineEnd, surroundingSpaceTypes.join(' and '), brackets.join(' ')).warn, file);
						}

						var tmpSource = source.replace(/(['"]).*\1/g, '$1$1');

						if (re.REGEX_ARRAY_INTERNAL_SPACE.test(tmpSource)) {
							var missingSpaces = [];

							source.replace(
								re.REGEX_ARRAY_INTERNAL_SPACE,
								function(item, index, str) {
									missingSpaces.push(item.replace('\t', '\\t'));
								}
							);

							trackErr(sub('Line: {0} Array items should be separated by exactly one space: {1}', lineEnd, missingSpaces.join('')).warn, file);
						}
					}

					if (leadingComma || trailingComma) {
						if (trailingComma) {
							var trailingStr = '';

							source = source.replace(
								re.REGEX_COMMA_TRAILING,
								function(str, closingBracket, index, fullString) {
									// Count the number of new lines between the trailing comma
									// and the end of the block, and update the lineNumber
									lineEnd -= (fullString.substring(index, fullString.length).split('\n').length - 1);

									trailingStr = str.replace(/\n|\t/g, '');

									return closingBracket;
								}
							);

							trackErr(sub('Line: {0} Trailing comma: {1}', lineEnd, trailingStr).warn, file);
						}

						if (leadingComma) {
							var leadingStr = '';

							source = source.replace(
								re.REGEX_COMMA_LEADING,
								function(str, openingBracket, index, fullString) {
									// Count the number of new lines between the leading comma
									// and the end of the block, and update the lineNumber
									lineStart += (str.split('\n').length - 1);

									leadingStr = str.replace(/\n|\t/g, '');

									return openingBracket;
								}
							);

							trackErr(sub('Line: {0} Leading comma: {1}', lineStart, leadingStr).warn, file);
						}

						node.update(source);
					}
				}

				var processorFn = processor[type];

				if (!processorFn) {
					if (node.type == 'Property') {
						if (!parent._col) {
							parent._col = [];
						}
						parent._col.push(node.key);
					}
				}
				else {
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
};

module.exports = checkJs;