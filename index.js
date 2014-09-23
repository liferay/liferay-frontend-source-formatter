#!/usr/bin/env node

var async = require('async');
var cli = require('cli');
var colors = require('colors');
var fs = require('fs');
var path = require('path');
var updateNotifier = require('update-notifier');

var base = require('./lib/base');
var re = require('./lib/re');

var A = base.A;
var argv = base.argv;
var fileErrors = base.fileErrors;
var trackErr = base.trackErr;

var notifier = updateNotifier();

if (notifier.update) {
	notifier.notify(true);
}

colors.setTheme(
	{
		error: 'red',
		help: 'cyan',
		subtle: 'grey',
		warn: 'yellow'
	}
);

var args = argv._;

if (argv.h) {
	return base.optimist.showHelp();
}

var INDENT = base.INDENT;

var QUIET = argv.q;
var VERBOSE = argv.v;
var RELATIVE = argv.r;
var INLINE_REPLACE = argv.i;
var CHECK_META = argv.m;
var LINT = argv.l;

var CWD = process.env.GIT_PWD || process.cwd();
var TOP_LEVEL;

if (!argv.color) {
	colors.mode = 'none';
}

var getLineNumber = A.cached(
	function(line) {
		var m = line.match(/Lines?: ([0-9]+)/);

		return parseInt(m && m[1], 10) || 0;
	}
);

var sortErrors = function(a, b) {
	var aNum = getLineNumber(a);
	var bNum = getLineNumber(b);

	return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
};

var formatPropertyItem = function(item) {
	return item.replace(re.REGEX_LEADING_SPACE, '').replace(re.REGEX_LEADING_INCLUDE, '');
};

var sub = base.sub;

var iterateLines = base.iterateLines;

var getValue = function(object, path) {
	if (A.Lang.isString(path)) {
		path = path.split('.');
	}

	return A.Object.getValue(object, path);
};

var iterateRules = function(rules, fullItem, context) {
	var instance = this;

	if (A.Lang.isString(rules)) {
		rules = getValue(re, rules);
	}

	var item = context.item;
	var lineNum = context.lineNum;
	var file = context.file;
	var formatItem = context.formatItem;
	var customIgnore = context.customIgnore;
	var hasSheBang = context.hasSheBang;

	if (A.Lang.isObject(rules)) {
		var ignore = rules.IGNORE;

		if ((!ignore || (ignore && !ignore.test(fullItem))) &&
			(!customIgnore || (customIgnore && !customIgnore.test(fullItem)))) {

			A.Object.each(
				rules,
				function(rule, ruleName) {
					if (ruleName === 'IGNORE' || ruleName.indexOf('_') === 0) {
						return;
					}

					if (rule.ignore == 'node' && hasSheBang) {
						return;
					}

					var regex = rule.regex;
					var test = rule.test || re.test;

					if (test === 'match') {
						test = re.match;
					}

					var testItem = item;

					if (rule.testFullItem) {
						testItem = fullItem;
					}

					var result = test(testItem, regex, rule, context);

					var message = rule.message || re.message;

					if (result) {
						var warning;

						if (A.Lang.isString(message)) {
							warning = re.message(message, lineNum, item, result, rule, context);
						}
						else if (A.Lang.isFunction(message)) {
							warning = message(lineNum, item, result, rule, context);
						}

						trackErr(warning.warn, file);

						var replacer = rule.replacer;

						if (replacer) {
							if (A.Lang.isString(replacer)) {
								fullItem = fullItem.replace(regex, replacer);
							}
							else if (A.Lang.isFunction(replacer)) {
								fullItem = replacer(fullItem, result, rule, context);
							}

							if (formatItem) {
								item = formatItem(fullItem, context);
							}
							else if (formatItem !== false) {
								item = fullItem.trim();
							}
						}
					}
				}
			);
		}
	}

	return fullItem;
};

var postFormatPropertyItem = function(fullItem) {
	return formatPropertyItem(fullItem.trim());
};

var checkCss = function(contents, file) {
	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			re.hasExtraNewLines(item, index, collection, file);

			var lineNum = index + 1;
			var nextItem = collection[lineNum] && collection[lineNum].trim();
			var previousItem = null;

			if (index > 0) {
				previousItem = collection[index - 1];
				previousItem = previousItem && previousItem.trim();
			}

			var rules = re.css;

			var propertyRules = rules._properties;

			var context = {
				file: file,
				item: item,
				lineNum: lineNum,
				nextItem: nextItem,
				previousItem: previousItem
			};

			fullItem = iterateRules('common', fullItem, context);

			item = context.item = fullItem.trim();

			if (re.hasProperty(item)) {
				item = formatPropertyItem(item);

				var propertyContext = A.merge(
					context,
					{
						formatItem: postFormatPropertyItem,
						item: item
					}
				);

				fullItem = iterateRules('css._properties', fullItem, propertyContext);

				var nextItemMatch;

				var itemMatch = item.match(re.REGEX_PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(re.REGEX_LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(re.REGEX_PROP_KEY);
				}

				if (itemMatch && nextItemMatch) {
					if (itemMatch[1] > nextItemMatch[1]) {
						trackErr(sub('Line: {0} Sort: {1} {2}', lineNum, item, nextItem).warn, file);
					}
				}
			}

			context.item = item;

			fullItem = iterateRules('css', fullItem, context);

			item = fullItem.trim();

			return fullItem;
		}
	);
};

var falafel = require('falafel');

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
	CallExpression: function(node, parent, file) {
		processor._processExpr(node, parent, file);
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

				var propValueFn = (parentValueType == 'FunctionExpression');

				if (!propValueFn) {
					var propValueMemberExp = (parentValueType == 'MemberExpression');
					var propValueIdentifier = (parentValueType == 'Identifier');

					var processVars = true;

					if (propValueMemberExp || propValueIdentifier) {
						var valName = parentValue.name;

						if (propValueMemberExp) {
							valName = parentValue.property.name;
						}

						processVars = (valName !== item.name);
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

					var lifecyleMethod = (propName in LIFECYCLE_METHODS || prevPropName in LIFECYCLE_METHODS);

					var prevPropUpperCase = /^[^a-z]+$/.test(prevPropName);
					var propUpperCase = /^[^a-z]+$/.test(propName);

					if (lifecyleMethod) {
						var customPropName = LIFECYCLE_METHODS[propName];
						var customPrevPropName = LIFECYCLE_METHODS[prevPropName];

						if (customPropName && customPrevPropName) {
							if (customPropName < customPrevPropName) {
								needsSort = true;
							}
						}
						else {
							if (customPropName) {
								if (!prevPropUpperCase && prevPropValueFn) {
									needsSort = true;
								}
							}
						}
					}
					else {
						if ((privateProp === privatePrevProp) && (propUpperCase === prevPropUpperCase) && naturalCompare(propName, prevPropName, true) === -1 && prevPropValueFn === propValueFn) {
							needsSort = true;
						}
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

var needsModuleVerification = false;
var liferayModuleDir = null;

var checkJs = function(contents, file, lint) {
	var hasSheBang = false;

	if (contents[0] === '#' && contents[1] === '!') {
		contents = '//' + contents;

		hasSheBang = true;
	}

	var fileDir = path.dirname(path.resolve(file));

	if (CHECK_META && !needsModuleVerification && path.basename(fileDir) === 'liferay' && fs.existsSync(path.join(fileDir, 'modules.js'))) {
		needsModuleVerification = true;
		liferayModuleDir = fileDir;
	}

	if (lint !== false && LINT !== false) {
		var linter = require('./lib/lint');

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
				nextItem: collection[lineNum] && collection[lineNum].trim(),
				lineNum: lineNum
			};

			fullItem = iterateRules('common', fullItem, context);

			item = context.item = fullItem.trim();

			fullItem = iterateRules('js', fullItem, context);

			item = context.item = fullItem.trim();

			return fullItem;
		}
	);
};

var getScriptletBlockReplacement = function(length) {
	return '/* scriptlet block ' + (new Array(length).join('\nvoid(0);')) + ' */';
};

var checkHTML = function(contents, file) {
	var hasJs = (re.REGEX_AUI_SCRIPT).test(contents);

	if (hasJs) {
		var reAUIScriptGlobal = new RegExp(re.REGEX_AUI_SCRIPT.source, 'g');

		var newContents = contents.replace(/<%.*?%>/gim, '_SCRIPTLET_')
							.replace(/<%=[^>]+>/g, '_ECHO_SCRIPTLET_')
							.replace(/<portlet:namespace \/>/g, '_PN_');

		newContents.replace(
			reAUIScriptGlobal,
			function(m, tagNamespace, scriptAttrs, body, index) {
				if (!body) {
					return;
				}

				var lineStart = newContents.substring(0, index).split('\n').length;

				var asyncAUIScript = tagNamespace && tagNamespace.indexOf('aui:') === 0 && scriptAttrs.indexOf('use="') > -1;

				iterateLines(
					body,
					function(item, index) {
						var fullItem = item;
						var lineNum = lineStart + index;

						item = item.trim();

						var context = {
							asyncAUIScript: asyncAUIScript,
							file: file,
							item: item,
							lineNum: lineNum,
							tagNamespace: tagNamespace,
							scriptAttrs: scriptAttrs,
							body: body,
							fullMatch: m
						};

						fullItem = iterateRules('htmlJS', fullItem, context);
					}
				);

				var rescanBlocks = [];

				body = body.replace(/\$\{.*?\}/g, '_EL_EXPRESSION_')
							.replace(
								/<%[^>]+>/g,
								function(m, index) {
									var len = m.length;
									var retVal = m;

									// If the last portion of this block is not the closing
									// scriptlet, let's keep track that we should rescan this
									// eg. when we hit cases like:
									// <% List<String> foo = null; %>
									// the regex will stop at String>

									if (m.substr(len - 2, len - 1) === '%>') {
										retVal = getScriptletBlockReplacement(m.split('\n').length);
									}
									else {
										rescanBlocks.push(true);
									}

									return retVal;
								}
							).replace(/<\/?[A-Za-z0-9-_]+:[^>]+>/g, '/* jsp tag */');

				if (rescanBlocks.length) {
					var scriptBlockRe = /<%/g;
					var match;

					// We didn't find the closing %>, so let's iterate
					// over all of the characters from the start of the
					// remaining scriptlet blocks until we get to %>

					while (match = scriptBlockRe.exec(body)) {
						var matchIndex = match.index;

						for (var i = matchIndex; i < body.length; i++) {
							var item = body.charAt(i);

							if (item && item == '>' && body.charAt(i - 1) == '%') {
								var block = body.substring(matchIndex, i + 1);

								body = body.replace(block, getScriptletBlockReplacement(block.split('\n').length));

								break;
							}
						};
					}
				}

				var lines = newContents.substring(0, index).split('\n').length;
				var prefix = new Array(lines).join('void(0);\n');

				checkJs(prefix + body, file, false);
			}
		);
	}

	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			re.hasExtraNewLines(item, index, collection, file);

			var lineNum = index + 1;

			var token = String.fromCharCode(-1);

			var m = fullItem.match(/<%.*?%>/g);

			var filteredItem = fullItem;

			var matches = m && m.map(
				function(item, index, collection) {
					filteredItem = filteredItem.replace(item, token + index + token);

					return item;
				}
			);

			var attrs = filteredItem.match(/(?: )?([A-Za-z0-9-]+=(["']).*?\2)/g);

			if (attrs) {
				var lastAttr = -1;

				attrs.forEach(
					function(item, index, collection) {
						var oldItem = item;

						var pieces = item.trim().match(/^([^=]+)=(["'])(.*)\2$/);

						var attrName = pieces[1];
						var attrValue = pieces[3];

						if (lastAttr > attrName) {
							var re = new RegExp('\\b' + lastAttr + '\\b.*?> ?<.*?' + attrName);

							var note = '';

							if (re.test(fullItem)) {
								note = '**';
							}

							if (!note || note && VERBOSE) {
								trackErr(sub('Line {0} Sort attributes{3}: {1} {2}', lineNum, lastAttr, attrName, note).warn, file);
							}
						}

						var styleAttr = (attrName == 'style');
						var onAttr = (attrName.indexOf('on') === 0);
						var labelAttr = (attrName.indexOf('label') === 0);

						var attrSep = ' ';

						if (styleAttr) {
							attrSep = /\s?;\s?/;
						}

						var attrValuePieces = attrValue.split(attrSep);

						var lastAttrPiece = -1;

						var sort = false;

						attrValuePieces.forEach(
							function(item, index, collection) {
								item = item.trim();
								if (/^[A-Za-z]/.test(item)) {
									// Skip event handlers like onClick, etc since they will have
									// complex values that probably shouldn't be sorted
									if (!onAttr && !labelAttr && lastAttrPiece > item) {
										trackErr(sub('Line {0} Sort attribute values: {1} {2}', lineNum, lastAttrPiece, item).warn, file);

										sort = true;
									}

									lastAttrPiece = item;
								}
							}
						);

						lastAttr = attrName;

						var newAttrValue;

						if (sort) {
							attrValuePieces = attrValuePieces.filter(
								function(item, index, collection) {
									return !!item.trim();
								}
							);

							attrValuePieces.sort();

							if (styleAttr) {
								newAttrValue = attrValuePieces.join('; ') + ';';
							}
							else {
								newAttrValue = attrValuePieces.join(' ');
							}

							item = item.replace(attrValue, newAttrValue);
						}

						filteredItem = filteredItem.replace(oldItem, item);
					}
				);
			}

			if (matches) {
				fullItem = filteredItem.replace(
					new RegExp(token + '(\\d+)' + token, 'g'),
					function(str, id) {
						return matches[id];
					}
				);
			}
			else {
				fullItem = filteredItem;
			}

			return fullItem;
		}
	);
};

var series = args.map(
	function(file) {
		return function(cb) {
			fs.readFile(
				file,
				'utf-8',
				function(err, data) {
					if (err) {
						var errMsg = 'Could not open file';

						if (!fs.existsSync(file)) {
							errMsg = 'File does not exist';
						}

						console.log('%s: %s', errMsg.error, path.resolve(file));

						return cb(null, '');
					}

					var formatter;

					if (re.REGEX_EXT_CSS.test(file)) {
						formatter = checkCss;
					}
					else if (re.REGEX_EXT_JS.test(file)) {
						formatter = checkJs;
					}
					else if (re.REGEX_EXT_HTML.test(file)) {
						formatter = checkHTML;
					}

					var content = data;

					if (formatter) {
						content = formatter(data, file);
					}

					var errors = fileErrors[file] || [];

					var includeHeaderFooter = (errors.length || !QUIET);

					if (includeHeaderFooter) {
						var fileName = file;

						if (RELATIVE) {
							file = path.relative(CWD, file);
						}

						console.log('File:'.blackBG + ' ' + file.underline);
					}

					if (errors.length) {
						errors.sort(sortErrors);

						console.log(INDENT + errors.join('\n' + INDENT));
					}
					else if (includeHeaderFooter) {
						console.log(INDENT + 'clear');
					}

					if (includeHeaderFooter) {
						console.log('----'.subtle);
					}

					var changed = (content != data);

					if (INLINE_REPLACE && changed) {
						fs.writeFile(
							file,
							content,
							function(err, result) {
								if (err) {
									return cb(null, '');
								}

								cb(null, content);
							}
						);
					}
					else {
						cb(null, content);
					}
				}
			);
		};
	}
);

series.push(
	function(cb) {
		if (needsModuleVerification) {
			require('./lib/meta').check(
				{
					cb: cb,
					liferayModuleDir: liferayModuleDir,
					series: series
				}
			);
		}
		else {
			cb();
		}
	}
);

var callback = function() {};

if (argv.o) {
	callback = function(err, result) {
		var errorFiles = Object.keys(fileErrors);

		if (errorFiles.length) {
			cli.exec(
				'git config --get user.editor',
				function(res) {
					cli.exec(
						'open -a "' + res[0] + '" "' + errorFiles.join('" "') + '"'
					);
				}
			);
		}
	};
}

if (RELATIVE) {
	series.unshift(
		function(cb) {
			cli.exec(
				'git rev-parse --show-toplevel',
				function(res) {
					TOP_LEVEL = res;
					cb();
				}
			);
		}
	);
}

async.series(series, callback);