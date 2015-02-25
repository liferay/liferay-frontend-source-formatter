var base = require('./base');
var re = require('./re');

var A = base.A;

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

exports.naturalCompare = function(a, b, caseInsensitive) {
	var result;

	if (A.Lang.isNumber(a) && A.Lang.isNumber(b)) {
		result = (a - b);
	}
	else {
		if (caseInsensitive === true) {
			a = a.toLowerCase();
			b = b.toLowerCase();
		}

		var aa = a.split(re.REGEX_DIGITS);
		var bb = b.split(re.REGEX_DIGITS);

		var length = Math.max(aa.length, bb.length);

		result = 0;

		for (var i = 0; i < length; i++) {
			var itemA = aa[i];
			var itemB = bb[i];

			if (itemA != itemB) {
				var cmp1 = parseInt(itemA, 10);
				var cmp2 = parseInt(itemB, 10);

				if (isNaN(cmp1)) {
					cmp1 = itemA;
				}

				if (isNaN(cmp2)) {
					cmp2 = itemB;
				}

				if (typeof cmp1 == 'undefined' || typeof cmp2 == 'undefined') {
					result = aa.length - bb.length;
				}
				else {
					result = cmp1 < cmp2 ? -1 : 1;
				}

				break;
			}
		}
	}

	return result;
};