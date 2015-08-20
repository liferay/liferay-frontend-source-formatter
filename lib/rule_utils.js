var _ = require('lodash');

var REGEX = require('./regex');

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

var compare = function(a, b) {
	var retVal = 0;

	if (a < b) {
		retVal = -1;
	}
	else if (a > b) {
		retVal = 1;
	}

	return retVal;
};

var compareAlpha = function(a, b, caseInsensitive, result) {
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

exports.naturalCompare = function(a, b, caseInsensitive) {
	var result = 0;

	if ((isFinite(a) && isFinite(b)) || (isFinite(+a) && isFinite(+b))) {
		result = compare(a, b);
	}
	else {
		result = compareAlpha(a, b, caseInsensitive, result);
	}

	return result;
};