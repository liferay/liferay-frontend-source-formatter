var _ = require('lodash');
var path = require('path');

var REGEX = require('./regex');

exports.getConstants = node => {
	var constants = [];

	node.body.forEach(
		(item, index) => {
			if (item.type == 'VariableDeclaration' && item.declarations) {
				item.declarations.forEach(
					(val, key) => {
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

var getIdentifiers = (node, obj) => {
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
		else if (type === 'UpdateExpression') {
			obj = getIdentifiers(node.argument);
		}
	}

	return obj;
};

exports.getIdentifiers = getIdentifiers;

// Gets distance between the end of "left" and the start of "right"
// Or, pass in leftEnd or rightStart to define whether
// it's the end or start of a line

exports.getLineDistance = (left, right, leftEnd, rightStart) => right.loc[rightStart || 'start'].line - left.loc[leftEnd || 'end'].line;

var compare = (a, b) => {
	var retVal = 0;

	if (a < b) {
		retVal = -1;
	}
	else if (a > b) {
		retVal = 1;
	}

	return retVal;
};

var compareAlpha = (a, b, caseInsensitive, result) => {
	if (caseInsensitive === true) {
		a = a.toLowerCase();
		b = b.toLowerCase();
	}

	var aa = a.split(REGEX.DIGITS);
	var bb = b.split(REGEX.DIGITS);

	var length = Math.max(aa.length, bb.length);

	for (var i = 0; i < length; i++) {
		var itemA = aa[i];
		var itemB = bb[i];

		if (itemA != itemB) {
			var cmp1 = itemA;
			var cmp2 = itemB;

			result = compare(cmp1, cmp2);

			break;
		}
	}

	return result;
};

var isFinite = _.isFinite;

exports.naturalCompare = (a, b, caseInsensitive) => {
	var result = 0;

	if ((isFinite(a) && isFinite(b)) || (isFinite(+a) && isFinite(+b))) {
		result = compare(a, b);
	}
	else {
		result = compareAlpha(a, b, caseInsensitive, result);
	}

	return result;
};

exports.getRuleId = filePath => {
	var baseName = path.basename(filePath, '.js');

	return `csf-${_.kebabCase(baseName)}`;
};