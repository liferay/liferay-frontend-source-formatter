var _ = require('lodash');
var base = require('../base');

var sub = require('string-sub');

module.exports = function(context) {
	var getAnonymousFnName = function(fnName) {
		if (!fnName) {
			fnName = '<anonymous>';
		}

		return fnName;
	};

	var getFnExpLines = function(lineBounds, node) {
		var end = getLineBounds(node, 'end');
		var start = end;

		node.arguments.forEach(
			function(item, index) {
				start = item.loc.start.line;
				end = item.loc.end.line;
			}
		);

		lineBounds.end = end;
		lineBounds.start = start;

		return lineBounds;
	};

	var getFnLines = function(node) {
		var callee = node.callee;

		var lineBounds = getLineBounds(node);

		var type = callee.type;

		if (type === 'FunctionExpression') {
			lineBounds = getFnExpLines(lineBounds, node);
		}
		else if (type === 'MemberExpression') {
			lineBounds.end = getLineBounds(node, 'end');
			lineBounds.start = getLineBounds(callee, 'end');
		}

		lineBounds.multi = (lineBounds.end > lineBounds.start);

		return lineBounds;
	};

	var getFnName = function(callee) {
		var fnName = callee.name;

		if (!fnName && callee.id) {
			fnName = callee.id.name;
		}

		var type = callee.type;

		if (type === 'FunctionExpression') {
			fnName = getAnonymousFnName(fnName);
		}
		else if (type === 'MemberExpression') {
			fnName = getMethodName(callee);
		}

		return fnName;
	};

	var getLineBounds = function(loc, prop) {
		var val = {};

		loc = loc.loc || loc;

		val.start = loc.start.line;
		val.end = loc.end.line;

		if (prop) {
			val = val[prop];
		}

		return val;
	};

	var getMethodName = function(callee) {
		var fnName = callee.property.name;

		if (!fnName && callee.object.callee) {
			fnName = callee.object.callee.name;
		}

		return fnName;
	};

	var getMultiLineError = function(error, loc, options) {
		var argStart = loc.start;
		var argEnd = loc.end;
		var fnStart = options.start;
		var fnEnd = options.end;

		if (options.multi) {
			if (argStart === fnStart) {
				error = 'Args should each be on their own line (args on start line)';
			}
			else if (argStart === fnStart || argEnd === fnEnd) {
				error = 'Args should each be on their own line (args on end line)';
			}
		}

		return error;
	};

	var logArgError = function(fnLines, fnName, node) {
		var message;

		var obj = processArgs(node.arguments, fnLines);

		var error = obj.error;

		if (error) {
			message = sub('{0}: {1}(...)', error, fnName);

			context.report(node, message);
		}
	};

	var processArgs = function(args, options) {
		var obj = {};

		var fnStart = options.start;
		var fnEnd = options.end;

		var multiLineFn = options.multi;

		var lastArgStartLine = 0;
		var lastArgEndLine = 0;

		var hasNonEmptyFunctionArg = false;
		var hasNonEmptyObjectArg = false;

		var testLineEndings = false;
		var argLineStarts = [];
		var argLineEnds = [];

		var error = '';

		args.forEach(
			function(item, index) {
				var type = item.type;

				var loc = getLineBounds(item.loc);

				var argStart = loc.start;
				var argEnd = loc.end;

				argLineStarts.push(argStart);
				argLineEnds.push(argEnd);

				if (type === 'FunctionExpression' && item.body.body.length) {
					hasNonEmptyFunctionArg = true;
				}
				else if (type === 'ObjectExpression' && item.properties.length) {
					hasNonEmptyObjectArg = true;
				}

				error = getMultiLineError(error, loc, options);

				if (argStart === lastArgStartLine || argStart === lastArgEndLine) {
					testLineEndings = true;
				}

				lastArgStartLine = argStart;
				lastArgEndLine = argEnd;
			}
		);

		if (testLineEndings) {
			var argLines = argLineStarts.concat(argLineEnds);

			if (hasNonEmptyFunctionArg || hasNonEmptyObjectArg || _.uniq(argLines).length > 1) {
				error = 'Args should each be on their own line (args on same line)';
			}
			else if (multiLineFn) {
				error = 'Function call can be all on one line';
			}
		}

		obj.error = error;

		return obj;
	};

	return {
		CallExpression: function(node) {
			var callee = node.callee;

			var fnName = getFnName(callee);
			var fnLines = getFnLines(node);

			if (node.arguments.length) {
				logArgError(fnLines, fnName, node);
			}
			else if (fnLines.multi) {
				var message = sub('Function call without arguments should be on one line: {0}()', fnName);

				context.report(node, message);
			}
		}
	};
};