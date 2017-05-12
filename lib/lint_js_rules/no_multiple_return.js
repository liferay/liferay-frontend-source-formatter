module.exports = {
	meta: {
		docs: {
			category: 'Fill me in',
			description: 'Enforces keeping a single return within a function',
			recommended: false
		},
		fixable: null,
		schema: []
	},

	create(context) {
		var funcInfo = null;

		var checkReturns = node => {
			if (funcInfo.returnCount > 1) {
				context.report(
					{
						message: 'Functions should only have one return statement',
						node
					}
				);
			}
		};

		return {
			'ArrowFunctionExpression:exit': checkReturns,
			'FunctionDeclaration:exit': checkReturns,
			'FunctionExpression:exit': checkReturns,

			onCodePathStart(codePath) {
				funcInfo = {
					returnCount: 0,
					upper: funcInfo
				};
			},

			onCodePathEnd() {
				funcInfo = funcInfo.upper;
			},

			'Program:exit': checkReturns,

			ReturnStatement(node) {
				funcInfo.returnCount += 1;
			}
		};
	}
};