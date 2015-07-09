module.exports = function(context) {
	function useInstance() {
		context.markVariableAsUsed('instance');
	}

	return {
		'VariableDeclaration': useInstance,
		'ReturnStatement': useInstance
	};
};