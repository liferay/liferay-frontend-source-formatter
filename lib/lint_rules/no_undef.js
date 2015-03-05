var _ = require('lodash');

var base = require('../base');
var stubs = base.stubs;

module.exports = function(context) {
	var noUndef = require('../../node_modules/eslint/lib/rules/no-undef');

	var collectedReport = [];

	var mockContext = {
		report: function() {
			collectedReport.push(arguments);
		}
	};

	_.defaults(mockContext, context);

	return {
		'Program:exit': function(node) {
			noUndef(mockContext)['Program:exit'](node);

			collectedReport.forEach(
				function(item, index) {
					var name = item[0].name;

					if (!stubs[name] && name.indexOf('_PN_') !== 0) {
						context.report.apply(context, item);
					}
				}
			);
		}
	};
};