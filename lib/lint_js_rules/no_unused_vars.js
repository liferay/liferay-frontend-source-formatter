var _ = require('lodash');

var base = require('../base');
var stubs = base.stubs;

var STUB_RE = new RegExp(`^${Object.keys(stubs).join('|')}`);

module.exports = {
	create(context) {
		function useInstance(node) {
			context.markVariableAsUsed('instance');
		}

		var lintRules = {
			'ReturnStatement': useInstance,
			'VariableDeclaration': useInstance
		};

		var options = context.options;

		if (options.length && options[0].jsp === true) {
			var noUnused = require('eslint/lib/rules/no-unused-vars').create;

			var collectedReport = [];

			var mockContext = {
				report(obj) {
					collectedReport.push(obj);
				},
				options: [
					{
						'args': 'none',
						'vars': 'local'
					}
				]
			};

			_.defaults(mockContext, context);

			mockContext.getSourceCode = context.getSourceCode;

			lintRules['Program:exit'] = node => {
				noUnused(mockContext)['Program:exit'](node);

				collectedReport.forEach(
					(item, index) => {
						var declaration = item.node;
						var name = declaration.name;

						var namespacedVar = STUB_RE.test(name);

						var namespacedFn = false;

						if (namespacedVar) {
							var parentType = declaration.parent.type;

							if (parentType === 'FunctionDeclaration' ||
								(parentType === 'VariableDeclarator' && declaration.parent.init && declaration.parent.init.type === 'FunctionExpression')
							) {
								namespacedFn = true;
							}
						}

						if (!stubs[name] && !namespacedVar || (namespacedVar && !namespacedFn)) {
							context.report(item);
						}
					}
				);
			};
		}

		return lintRules;
	}
};