var base = require('../base');
var re = require('../re');

module.exports = function(context) {
	var testVarNames = function(varName, node) {
		var pass = true;

		if (re.REGEX_VAR_IS.test(varName)) {
			context.report(node, base.sub('Variable/property names should not start with is*: {0}', varName));
			pass = false;
		}

		return pass;
	};

	var testFunctionParams = function(node) {
		var params = node.params;

		params.forEach(
			function(item, index) {
				testVarNames(item.name, node);
			}
		);
	};

	return {
		FunctionExpression: testFunctionParams,

		FunctionDeclaration: testFunctionParams,

		Property: function(node) {
			var value = node.value;
			var valueType = value.type;

			if (valueType !== 'FunctionExpression') {
				var key = node.key;

				var propValueMemberExp = (valueType == 'MemberExpression');
				var propValueIdentifier = (valueType == 'Identifier');

				var processVars = true;

				if (propValueMemberExp || propValueIdentifier) {
					var valName = value.name;

					if (propValueMemberExp) {
						valName = value.property.name;
					}

					processVars = (valName !== key.name) && !(re.REGEX_LANG_EMPTYFN.test(context.getSource(value)));
				}

				if (processVars) {
					testVarNames(key.name, node);
				}
			}
		},

		VariableDeclaration: function(node) {
			node.declarations.forEach(
				function(item, index) {
					var process = true;

					var varName = item.id.name;

					var init = item.init;

					if (init) {
						var itemType = init.type;

						if (itemType !== 'FunctionExpression' && itemType === 'MemberExpression' && init.property.name == varName) {
							process = false;
						}
					}

					if (process) {
						testVarNames(varName, node);
					}
				}
			);
		},
	};
};