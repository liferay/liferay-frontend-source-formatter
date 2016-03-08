var base = require('../base');
var utils = require('../rule_utils');

var getLineDistance = utils.getLineDistance;
var naturalCompare = utils.naturalCompare;

var sub = require('string-sub');

var REGEX_FOR = /For.*Statement/

module.exports = function(context) {
	var configuration = context.options[0] || {};
	var caseSensitive = configuration.casesensitive;

	var variables = [];

	var destructuredVars = [];

	var findVars = function(node) {
		if (!REGEX_FOR.test(node.parent.type)) {
			node.declarations.forEach(
				function(val, key) {
					if (val.init && val.init.type === 'Literal') {
						variables.push(val);
					}
					else if (val.id.type === 'ObjectPattern') {
						destructuredVars.push(val.id.properties);
					}
				}
			);
		}
	};

	return {
		'Program:exit': function(){
			var varGroups = variables.reduce(
				function(prev, item, index) {
					var lineDistance = getLineDistance(prev, item);

					if (lineDistance === 1 || lineDistance === 0) {
						var prevName = prev.id.name;
						var curName = item.id.name;

						var result = naturalCompare(curName, prevName, !caseSensitive);

						if (result === -1) {
							var message = sub('Sort variables: {0} {1}', prevName, curName);

							context.report(prev, message);
						}
					}

					return item;
				},
				variables[0]
			);

			destructuredVars.forEach(
				function(item, index) {
					var destructuredVarGroups = item.reduce(
						function(prev, item, index) {
							var prevName = prev.key.name;
							var curName = item.key.name;

							var result = naturalCompare(curName, prevName, !caseSensitive);

							if (result === -1) {
								var message = sub('Sort variables: {0} {1}', prevName, curName);

								context.report(prev, message);
							}

							return item;
						},
						item[0]
					);
				}
			);
		},

		VariableDeclaration: findVars
	};
};