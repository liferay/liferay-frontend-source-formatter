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
		fixable: null,  // or "code" or "whitespace"
		schema: [
			// fill in your schema
		]
	},

	create: function(context) {
		var funcInfo = null;

		var checkReturns = function(node) {
			if (funcInfo.returnCount > 1) {
				context.report(
					{
						message: 'Functions should only have one return statement',
						node: node
					}
				);
			}
		};

		return {
			onCodePathStart: function(codePath) {
				funcInfo = {
					upper: funcInfo,
					returnCount: 0
				};
			},
			onCodePathEnd: function() {
				funcInfo = funcInfo.upper;
			},

			ReturnStatement: function(node) {
				funcInfo.returnCount += 1;
			},

			'Program:exit': checkReturns,
            'FunctionDeclaration:exit': checkReturns,
            'FunctionExpression:exit': checkReturns,
            'ArrowFunctionExpression:exit': checkReturns
		};
	}
};