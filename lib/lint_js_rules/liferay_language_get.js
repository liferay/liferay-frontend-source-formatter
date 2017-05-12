module.exports = context => {
	var REGEX_STRING = /^(['"]).*\1$/;

	var isMemberExpression = obj => obj.type === 'MemberExpression';

	return {
		CallExpression(node) {
			var callee = node.callee;

			if (isMemberExpression(callee) && isMemberExpression(callee.object) && callee.object.object.name === 'Liferay' && callee.object.property.name === 'Language' && callee.property.name === 'get') {

				var args = node.arguments;

				if (args.length === 1) {
					var arg = args[0];

					if (arg.type !== 'Literal' || !REGEX_STRING.test(arg.raw)) {
						context.report(node, 'You should only pass a single string literal to Liferay.Language.get()');
					}
				}
				else {
					context.report(node, 'Liferay.Language.get() only accepts a single string as an argument');
				}
			}
		}
	};
};