var base = require('../base');
var utils = require('../rule_utils');

var getLineDistance = utils.getLineDistance;
var naturalCompare = utils.naturalCompare;

var sub = require('string-sub');

var REGEX_FOR = /For.*Statement/;

var REGEX_VAR = /Literal|CallExpression/;

module.exports = function(context) {
	var configuration = context.options[0] || {};
	var caseSensitive = configuration.casesensitive;

	var variables = [];
	var destructuredVars = [];
	var imports = [];

	var findVars = function(node) {
		if (!REGEX_FOR.test(node.parent.type)) {
			var declarations = node.declarations;
			var specifiers = node.specifiers;

			if (declarations) {
				declarations.forEach(
					function(val, key) {
						if (val.init && REGEX_VAR.test(val.init.type)) {
							variables.push(val);
						}
						else if (val.id.type === 'ObjectPattern') {
							var props = val.id.properties.filter(
								function(item, index) {
									return item.key;
								}
							);

							destructuredVars.push(props);
						}
					}
				);
			}
			else {
				specifiers = specifiers.filter(
					function(item, index) {
						return item.type !== 'ImportDefaultSpecifier';
					}
				);

				if (specifiers.length > 1) {
					imports.push(specifiers);
				}
			}
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

			imports.forEach(
				function(item, index) {
					var importGroups = item.reduce(
						function(prev, item, index) {
							var prevName = prev.local.name;
							var curName = item.local.name;

							if (prevName === prev.imported.name && curName === item.imported.name) {
								var result = naturalCompare(curName, prevName, !caseSensitive);

								if (result === -1) {
									var message = sub('Sort imported members: {0} {1}', prevName, curName);

									context.report(prev, message);
								}
							}

							return item;
						},
						item[0]
					);
				}
			);
		},

		ImportDeclaration: findVars,

		VariableDeclaration: findVars
	};
};