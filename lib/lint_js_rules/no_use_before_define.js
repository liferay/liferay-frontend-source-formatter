var _ = require('lodash');

module.exports = context => {
	var noUse = require('eslint/lib/rules/no-use-before-define').create;

	var collectedReport = [];

	var options = context.options;

	var sameScope = false;

	if (_.isPlainObject(options[0])) {
		sameScope = options[0].samescope;

		options[0] = _.omit(options[0], 'samescope');
	}

	var mockContext = {
		report(obj) {
			var report = true;

			if (sameScope) {
				var scope = mockContext.getScope();

				scope.references.forEach(
					reference => {
						if (reference.identifier !== obj.node) {
							return;
						}

						var variable = reference.resolved;

						report = reference.from.variableScope === variable.scope;
					}
				);
			}

			if (report) {
				collectedReport.push(obj);
			}
		}
	};

	_.defaults(mockContext, context);

	var defaultRule = noUse(mockContext);

	return _.defaults(
		{
			'Program:exit': function(node) {
				defaultRule['Program:exit'](node);

				collectedReport.forEach(
					(item, index) => {
						context.report(item);
					}
				);
			}
		},
		defaultRule
	);
};