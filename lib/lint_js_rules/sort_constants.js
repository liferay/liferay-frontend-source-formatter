var _ = require('lodash');
var base = require('../base');
var utils = require('../rule_utils');

var sub = require('string-sub');

var REGEX_UNDERSCORE = /_/g;

module.exports = function(context) {
	// Recursive function for collecting identifiers from node
	var getIdentifiers = function(node, obj) {
		obj = obj || {};

		if (node) {
			var type = node.type;

			if (type === 'Identifier') {
				obj[node.name] = true;
			}
			else if (type === 'Property') {
				obj = getIdentifiers(node.key, obj);
				obj = getIdentifiers(node.value, obj);
			}
			else if (type === 'BinaryExpression') {
				obj = getIdentifiers(node.left, obj);
				obj = getIdentifiers(node.right, obj);
			}
			else if (type === 'CallExpression' || type === 'ObjectExpression') {
				var prop = 'properties';

				if (type === 'CallExpression') {
					obj = getIdentifiers(node.callee, obj);

					prop = 'arguments';
				}

				node[prop].forEach(_.ary(_.bindRight(getIdentifiers, null, obj), 1));
			}
			else if (type === 'MemberExpression') {
				obj = getIdentifiers(node.object, obj);
				obj = getIdentifiers(node.property, obj);
			}
		}

		return obj;
	};

	var checkSort = function(node) {
		var constants = utils.getConstants(node);

		var prevConstants = [];

		constants.forEach(
			function(item, index, coll) {
				var prev = coll[index - 1];

				var itemName = item.id.name;

				if (prev) {
					var prevName = prev.id.name;

					var diff = utils.getLineDistance(prev, item);

					if (diff === 2 && prevName.replace(REGEX_UNDERSCORE, '') > itemName.replace(REGEX_UNDERSCORE, '')) {
						var identifiers = getIdentifiers(item.init);

						var hasReference = prevConstants.some(
							function(item, index) {
								return identifiers[item];
							}
						);

						if (!hasReference) {
							var message = sub('Sort constants: {0} {1}', prevName, itemName);

							context.report(prev, message);
						}
					}
				}

				prevConstants.push(itemName);
			}
		);
	};

	return {
		BlockStatement: checkSort,
		Program: checkSort
	};
};