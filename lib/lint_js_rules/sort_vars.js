var _ = require('lodash');
var utils = require('../rule_utils');

var getLineDistance = utils.getLineDistance;
var naturalCompare = utils.naturalCompare;

var sub = require('string-sub');

var REGEX_ASSIGNMENT_PATTERNS = /(Object|Array)Pattern/;

var REGEX_FOR = /For.*Statement/;

var getIdentifiers = utils.getIdentifiers;

module.exports = context => {
	var configuration = context.options[0] || {};

	var caseSensitive = configuration.casesensitive;

	var destructuredVars = [];
	var imports = [];
	var variables = [];

	var findVars = node => {
		if (!REGEX_FOR.test(node.parent.type)) {
			var declarations = node.declarations;
			var specifiers = node.specifiers;

			if (declarations) {
				declarations.forEach(
					(val, key) => {
						var varType = val.id.type;

						var destructuredVar = REGEX_ASSIGNMENT_PATTERNS.test(varType);

						if (val.init && !destructuredVar) {
							variables.push(val);
						}
						else if (destructuredVar && varType === 'ObjectPattern') {
							var props = val.id.properties.filter(
								(item, index) => item.key
							);

							destructuredVars.push(props);
						}
					}
				);
			}
			else {
				specifiers = specifiers.filter(
					(item, index) => item.type !== 'ImportDefaultSpecifier'
				);

				if (specifiers.length > 1) {
					imports.push(specifiers);
				}
			}
		}
	};

	return {
		'Program:exit': function() {
			variables.reduce(
				(prev, item, index) => {
					var lineDistance = getLineDistance(prev, item);

					if (lineDistance === 1 || lineDistance === 0) {
						var curName = item.id.name;
						var prevName = prev.id.name;

						var result = naturalCompare(curName, prevName, !caseSensitive);

						if (result === -1) {
							var messageStr = 'Sort variables: {0} {1}';

							var identifiers = getIdentifiers(item.init);

							if (identifiers[prevName]) {
								messageStr += `. If you're using "${prevName}" in assigning a value to "${curName}", add a newline between them.`
							}

							var message = sub(messageStr, prevName, curName);

							context.report(prev, message);
						}
					}

					return item;
				},
				variables[0]
			);

			destructuredVars.forEach(
				(item, index) => {
					item.reduce(
						(prev, item, index) => {
							var curName = item.key.name;
							var prevName = prev.key.name;

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
				(item, index) => {
					item.reduce(
						(prev, item, index) => {
							var curName = item.local.name;
							var prevName = prev.local.name;

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