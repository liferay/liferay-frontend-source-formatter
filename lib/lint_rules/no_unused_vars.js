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
		var noUnused = require('../../node_modules/eslint/lib/rules/no-unused-vars');

		var collectedReport = [];

		var mockContext = {
			report: function() {
				collectedReport.push(arguments);
			},
			options: [{'vars': 'local', 'args': 'none'}]
		};

		_.defaults(mockContext, context);

		lintRules['Program:exit'] = function(node) {
			noUnused(mockContext)['Program:exit'](node);

			collectedReport.forEach(
				function(item, index) {
					var declaration = item[0];
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
						context.report.apply(context, item);
					}
				}
			);
		}
	}

	return lintRules;
};