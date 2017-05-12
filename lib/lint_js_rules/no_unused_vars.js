var _ = require('lodash');

var base = require('../base');
var stubs = base.stubs;
var portletNS = base.jspLintStubs.namespace;

var STUB_RE = new RegExp(`^${Object.keys(stubs).join('|')}`);

module.exports = {
	create(context) {
		function useInstance(node) {
			context.markVariableAsUsed('instance');
		}

		var lintRules = {
			'VariableDeclaration': useInstance,
			'ReturnStatement': useInstance
		};

		var options = context.options;

		if (options.length && options[0].jsp === true) {
			var noUnused = require('eslint/lib/rules/no-unused-vars').create;

			var collectedReport = [];

			var mockContext = {
				report(obj) {
					collectedReport.push(obj);
				},
				options: [{'vars': 'local', 'args': 'none'}]
			};

			_.defaults(mockContext, context);

			mockContext.getSourceCode = context.getSourceCode;

			lintRules['Program:exit'] = node => {
				noUnused(mockContext)['Program:exit'](node);

				// console.log(collectedReport);

				collectedReport.forEach(
					(item, index) => {
						var declaration = item.node;
						var name = declaration.name;

						var namespacedVar = STUB_RE.test(name);

						var namespacedFn = false;

						if (namespacedVar) {
							// item[0].name = name.replace(portletNS, '<portlet:namespace />');
							// item[2].name = name.replace(portletNS, '<portlet:namespace />');

							var parentType = declaration.parent.type;

							if (parentType === 'FunctionDeclaration' ||
								(parentType === 'VariableDeclarator' && declaration.parent.init.type === 'FunctionExpression')
							) {
								namespacedFn = true;
							}
						}

						if (!stubs[name] && !namespacedVar || (namespacedVar && !namespacedFn)) {
							context.report(item);
						}
					}
				);
			}
		}

		return lintRules;
	}
};