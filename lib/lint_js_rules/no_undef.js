var _ = require('lodash');

var base = require('../base');
var stubs = base.stubs;

module.exports = function(context) {
	var noUndef = require('eslint/lib/rules/no-undef').create;

	var collectedReport = [];

	var mockContext = {
		report: function(obj) {
			collectedReport.push(obj);
		}
	};

	_.defaults(mockContext, context, {options: context.options});

	return {
		'Program:exit': function(node) {
			noUndef(mockContext)['Program:exit'](node);

			collectedReport.forEach(
				function(item, index) {
					var name = item.node.name;

					if (!stubs[name] && name.indexOf('_PN_') !== 0) {
						context.report(item);
					}
				}
			);
		}
	};
};