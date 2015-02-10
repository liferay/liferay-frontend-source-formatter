exports.getConstants = function(node) {
	var constants = [];

	node.body.forEach(
		function(item, index) {
			if (item.type == 'VariableDeclaration' && item.declarations) {
				item.declarations.forEach(
					function(val, key) {
						if (/^[A-Z0-9_]+$/.test(val.id.name)) {
							constants.push(val);
						}
					}
				);
			}
		}
	);

	return constants;
};

// Gets distance between the end of "left" and the start of "right"

exports.getLineDistance = function(left, right) {
	return right.loc.start.line - left.loc.end.line;
};