var findFirstofLastLine = function(tokens, line) {
	var firstOfLast = null;

	for (var i = 0, len = tokens.length; i < len; i++) {
		var token = tokens[i];

		if (token.loc.start.line === line) {
			firstOfLast = token;

			break;
		}
	}

	return firstOfLast;
};

var isSameColumn = function(a, b, requireKeyword) {
	var inc = requireKeyword ? 3 : 0;

	return a.loc.start.column === (b.loc.start.column + inc);
};

var isSameLine = function(a, b) {
	return a.loc.start.line === b.loc.start.line;
};

module.exports = function(context) {
	var checkEndColumn = function(declaration, init, node) {
		var decLoc = declaration.loc;
		var decStart = decLoc.start;

		if (init.type === 'BinaryExpression' &&
			init.operator === '+' &&
			decLoc.end.line > decStart.line &&
			!isSameColumn(declaration, init.right)) {

			var tokens = context.getTokens(node);

			var firstOfLast = findFirstofLastLine(tokens, decLoc.end.line);

			var assignmentExpression = (node.type === 'AssignmentExpression');

			if (!isSameColumn(declaration, firstOfLast, !assignmentExpression)) {
				var id = assignmentExpression ? declaration.left : declaration.id;

				context.report(
					node,
					'Multi-line strings should be aligned to the start of the variable name "{{identifier}}"',
					{
						identifier: id.name
					}
				);
			}
		}
	};

	var checkStartLine = function(id, init, node) {
		var allowedFormat = isSameLine(id, init);

		if (!allowedFormat) {
			var message = 'Variable values should start on the same line as the variable name "{{identifier}}"';
			var info = {
				identifier: id.name
			};

			if (init.type === 'LogicalExpression' || init.type === 'JSXElement') {
				var token = context.getTokenBefore(init);

				allowedFormat = (token.value === '(' && isSameLine(id, token));
			}
			else if (id.type === 'ObjectPattern' || id.type === 'ArrayPattern') {
				var startToken = context.getFirstToken(id);
				var endToken = context.getLastToken(id);
				var keywordToken = context.getTokenBefore(id);

				var startOnSameLineAsKeyword = isSameLine(keywordToken, startToken);
				var endOnSameLineAsInit = isSameLine(init, endToken);

				allowedFormat = startOnSameLineAsKeyword && endOnSameLineAsInit;

				if (!allowedFormat) {
					info = {
						startToken: startToken.value,
						endToken: endToken.value,
						keywordToken: keywordToken.value,
						initName: init.name || context.getSourceCode().getText(init)
					};

					if (!startOnSameLineAsKeyword && !endOnSameLineAsInit) {
						message = 'Destructured assignments should have "{{startToken}}" on the same line as "{{keywordToken}}" and "{{endToken}}" should be on the same line as "{{initName}}"';
					}
					else if (!startOnSameLineAsKeyword) {
						message = 'Destructured assignments should have "{{startToken}}" on the same line as "{{keywordToken}}"';
					}
					else {
						message = 'Destructured assignments should have "{{endToken}}" on the same line as "{{initName}}"';
					}
				}
			}

			if (!allowedFormat) {
				context.report(
					node,
					message,
					info
				);
			}
		}
	};

	return {
		AssignmentExpression: function(node) {
			checkStartLine(node.left, node.right, node);
			checkEndColumn(node, node.right, node);
		},

		VariableDeclaration: function(node) {
			var declarations = node.declarations;

			var dec = declarations[0];
			var decId = dec.id;
			var decInit = dec.init;

			if (decInit) {
				checkStartLine(decId, decInit, node);
				checkEndColumn(dec, decInit, node);
			}
		}
	};
};