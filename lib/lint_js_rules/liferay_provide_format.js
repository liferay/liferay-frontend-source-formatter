module.exports = function(context) {
	return {
		CallExpression: function(node) {
			var callee = node.callee;

			if (callee.type === 'MemberExpression' && callee.object.name === 'Liferay' && callee.property.name === 'provide') {
				var args = node.arguments;

				if (args.length < 4) {
					context.report(node, 'Missing dependencies (don\'t use Liferay.provide to create regular functions).');
				}
				else {
					var arg0 = args[0];
					var arg1 = args[1];
					var arg2 = args[2];
					var arg3 = args[3];

					var arg0Type = arg0.type;
					var arg1Type = arg1.type;
					var arg2Type = arg2.type;
					var arg3Type = arg3.type;

					if (arg0Type !== 'Identifier' && arg0Type !== 'MemberExpression') {
						context.report(arg0, 'Liferay.provide expects an object as the first argument.');
					}

					if (arg1Type !== 'Identifier' && typeof arg1.value !== 'string') {
						context.report(arg1, 'Liferay.provide expects a string as the second argument.');
					}

					if (arg2Type !== 'Identifier' && arg2Type !== 'FunctionExpression') {
						context.report(arg2, 'Liferay.provide expects a function as the third argument.');
					}

					var arg3TypeExpression = arg3Type === 'CallExpression';

					if (arg3Type !== 'Identifier' && arg3Type !== 'ArrayExpression' && !arg3TypeExpression || arg3TypeExpression && arg3.callee.object.type !== 'ArrayExpression') {
						context.report(arg3, 'Liferay.provide expects an array as the last argument.');
					}
					else if (arg3Type === 'ArrayExpression' && !arg3.elements.length) {
						context.report(arg3, 'Liferay.provide dependencies should have at least one dependency.');
					}
				}
			}
		}
	};
};