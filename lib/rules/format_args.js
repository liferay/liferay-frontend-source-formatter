var base = require('../base');
var utils = require('../rule_utils');

var A = base.A;

module.exports = function(context) {
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

	var processArgs = function(args, options) {
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
	};

	return {
		CallExpression: function(node) {
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

			var message;

			if (args.length) {
				var obj = processArgs(
					args,
					{
						fnEnd: fnEnd,
						fnStart: fnStart,
						multiLineFn: multiLineFn
					}
				);

				var error = obj.error;

				if (error) {
					message = base.sub('{0}: {1}(...)', error, fnName);

					context.report(node, message);
				}
			}
			else if (multiLineFn) {
				message = base.sub('Function call without arguments should be on one line: {0}()', fnName);

				context.report(node, message);
			}
		}
	};
};