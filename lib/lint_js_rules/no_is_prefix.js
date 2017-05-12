var REGEX = require('../regex');

var sub = require('string-sub');

module.exports = context => {
	var checkProcessVars = node => {
		var value = node.value;
		var valueType = value.type;

		var propValueIdentifier = (valueType === 'Identifier');
		var propValueMemberExp = (valueType === 'MemberExpression');

		var processVars = true;

		if (propValueMemberExp || propValueIdentifier) {
			var valName = value.name;

			if (propValueMemberExp) {
				valName = value.property.name;
			}

			processVars = (valName !== node.key.name) && !(REGEX.LANG_EMPTYFN.test(context.getSource(value)));
		}

		return processVars;
	};

	var testVarNames = (varName, node) => {
		var pass = true;

		if (REGEX.VAR_IS.test(varName)) {
			context.report(node, sub('Variable/property names should not start with is*: {0}', varName));
			pass = false;
		}

		return pass;
	};

	var testFunctionParams = node => {
		var params = node.params;

		params.forEach(
			(item, index) => {
				testVarNames(item.name, node);
			}
		);
	};

	return {
		FunctionExpression: testFunctionParams,

		FunctionDeclaration: testFunctionParams,

		Property(node) {
			if (node.value.type !== 'FunctionExpression') {
				var processVars = checkProcessVars(node);

				if (processVars) {
					testVarNames(node.key.name, node);
				}
			}
		},

		VariableDeclaration(node) {
			node.declarations.forEach(
				(item, index) => {
					var process = true;

					var varName = item.id.name;

					var init = item.init;

					if (init) {
						var itemType = init.type;

						if (itemType === 'FunctionExpression' ||
							(itemType === 'MemberExpression' && init.property.name === varName)) {

							process = false;
						}
					}

					if (process) {
						testVarNames(varName, node);
					}
				}
			);
		}
	};
};