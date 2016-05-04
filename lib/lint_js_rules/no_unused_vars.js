var _ = require('lodash');

var base = require('../base');
var stubs = base.stubs;
var portletNS = base.jspLintStubs.namespace;

module.exports = function(context) {
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
			report: function(obj) {
				collectedReport.push(obj);
			},
			options: [{'vars': 'local', 'args': 'none'}]
		};

		_.defaults(mockContext, context);

		lintRules['Program:exit'] = function(node) {
			noUnused(mockContext)['Program:exit'](node);

			// console.log(collectedReport);

			collectedReport.forEach(
				function(item, index) {
					var declaration = item.node;
					var name = declaration.name;

					var namespacedVar = name.indexOf(portletNS) === 0;

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
};