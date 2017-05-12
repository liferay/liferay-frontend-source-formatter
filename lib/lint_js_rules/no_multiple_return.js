var _ = require('lodash');
var sub = require('string-sub');

var base = require('../base');
var utils = require('../rule_utils');

module.exports = {
	meta: {
		docs: {
			description: 'Enforces keeping a single return within a function',
			category: 'Fill me in',
			recommended: false
		},
		fixable: null, // or "code" or "whitespace"
		schema: [
			// fill in your schema
		]
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
			onCodePathStart(codePath) {
				funcInfo = {
					upper: funcInfo,
					returnCount: 0
				};
			},
			onCodePathEnd() {
				funcInfo = funcInfo.upper;
			},

			ReturnStatement(node) {
				funcInfo.returnCount += 1;
			},

			'Program:exit': checkReturns,
			'FunctionDeclaration:exit': checkReturns,
			'FunctionExpression:exit': checkReturns,
			'ArrowFunctionExpression:exit': checkReturns
		};
	}
};