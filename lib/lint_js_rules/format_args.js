var _ = require('lodash');

var sub = require('string-sub');

module.exports = context => {
	var isFunctionExpression = type => _.endsWith(type, 'FunctionExpression');

	var isCallable = type => isFunctionExpression(type) || type === 'CallExpression';

	var getAnonymousFnName = fnName => {
		if (!fnName) {
			fnName = '<anonymous>';
		}

		return fnName;
	};

	var getFnExpLines = (lineBounds, node) => {
		var end = lineBounds.end;
		var start = lineBounds.start;

		if (node.callee && isFunctionExpression(node.callee.type)) {
			start = end;
		}

		if (node.arguments && node.arguments.length) {
			node.arguments.forEach(
				(item, index) => {
					var type = item.type;

					if (isCallable(type)) {
						var argLineBounds = getFnLines(item);

						start = Math.min(argLineBounds.start, start);
						end = Math.max(argLineBounds.end, end);
					}
					else {
						start = item.loc.start.line;
						end = item.loc.end.line;
					}
				}
			);
		}

		lineBounds.end = end;
		lineBounds.start = start;

		return lineBounds;
	};

	var getFnLines = node => {
		var lineBounds = getLineBounds(node);

		var callee = node.callee;

		if (callee) {
			var type = callee.type;

			if (isCallable(type)) {
				lineBounds = getFnExpLines(lineBounds, node);
			}
			else if (type === 'MemberExpression') {
				lineBounds.end = getLineBounds(node, 'end');
				lineBounds.start = getLineBounds(callee, 'end');
			}
		}

		lineBounds.multi = (lineBounds.end > lineBounds.start);

		return lineBounds;
	};

	var getFnName = callee => {
		var fnName = callee.name;

		if (!fnName && callee.id) {
			fnName = callee.id.name;
		}

		var type = callee.type;

		if (isFunctionExpression(type)) {
			fnName = getAnonymousFnName(fnName);
		}
		else if (type === 'MemberExpression') {
			fnName = getMethodName(callee);
		}
		else if (type === 'CallExpression') {
			fnName = callee.callee.name;
		}

		return fnName;
	};

	var getLineBounds = (loc, prop) => {
		var val = {};

		loc = loc.loc || loc;

		val.start = loc.start.line;
		val.end = loc.end.line;

		if (prop) {
			val = val[prop];
		}

		return val;
	};

	var getMethodName = callee => {
		var fnName = callee.property.name;

		if (!fnName && callee.object.callee) {
			fnName = callee.object.callee.name;
		}

		return fnName;
	};

	var getMultiLineError = (error, loc, options) => {
		var argEnd = loc.end;
		var argStart = loc.start;
		var fnEnd = options.end;
		var fnStart = options.start;

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

	var logArgError = (fnLines, fnName, node) => {
		var message;

		var obj = processArgs(node.arguments, fnLines, node);

		var error = obj.error;

		if (error) {
			message = sub('{0}: {1}(...)', error, fnName);

			context.report(node, message);
		}
	};

	var processArgs = (args, options, node) => {
		var obj = {};

		var multiLineFn = options.multi;

		var lastArgEndLine = 0;
		var lastArgStartLine = 0;

		var hasNonEmptyFunctionArg = false;
		var hasNonEmptyObjectArg = false;

		var argLineEnds = [];
		var argLineStarts = [];

		var testLineEndings = false;

		var error = '';

		args.forEach(
			(item, index) => {
				var type = item.type;

				var loc = getLineBounds(item.loc);

				var argStart = loc.start;
				var argEnd = loc.end;

				argLineEnds.push(argEnd);
				argLineStarts.push(argStart);

				if (type === 'FunctionExpression' && item.body.body.length) {
					hasNonEmptyFunctionArg = true;
				}
				else if (type === 'ObjectExpression' && item.properties.length && _.findIndex(item.properties, ['shorthand', true]) === -1) {
					hasNonEmptyObjectArg = true;
				}

				error = getMultiLineError(error, loc, options);

				if (argStart === lastArgStartLine || argStart === lastArgEndLine) {
					testLineEndings = true;
				}

				lastArgEndLine = argEnd;
				lastArgStartLine = argStart;
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
		CallExpression(node) {
			var callee = node.callee;

			var fnLines = getFnLines(node);
			var fnName = getFnName(callee);

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