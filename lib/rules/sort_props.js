var base = require('../base');
var re = require('../re');
var A = base.A;

var isPrivate = function(str) {
	return A.Lang.isString(str) && str.charAt(0) === '_';
};

var LIFECYCLE_METHODS = {
	init: -1100,
	initializer: -1000,
	renderUI: -900,
	bindUI: -800,
	syncUI: -700,
	destructor: -600
};

var naturalCompare = function(a, b, caseInsensitive) {
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

module.exports = function(context) {
	return {
		ObjectExpression: function(node) {
			var prev = null;
			var prevParent = null;

			node.properties.forEach(
				function(item, index, collection) {
					var key = item.key;

					if (index > 0) {
						var prevKey = prev.key;

						var needsSort = false;

						var propName = key.name || key.value;
						var prevPropName = prevKey.name || prevKey.value;

						var privateProp = isPrivate(propName);
						var privatePrevProp = isPrivate(prevPropName);

						var propValueFn = (item.value.type == 'FunctionExpression');
						var prevPropValueFn = (prev.value.type == 'FunctionExpression');

						var lifecyleMethod = (LIFECYCLE_METHODS.hasOwnProperty(propName) || LIFECYCLE_METHODS.hasOwnProperty(prevPropName));

						var prevPropUpperCase = /^[^a-z]+$/.test(prevPropName);
						var propUpperCase = /^[^a-z]+$/.test(propName);

						if (lifecyleMethod) {
							var customPropName = LIFECYCLE_METHODS[propName];
							var customPrevPropName = LIFECYCLE_METHODS[prevPropName];

							if (customPropName) {
								if (customPrevPropName) {
									needsSort = customPropName < customPrevPropName;
								}
								else {
									needsSort = (!prevPropUpperCase && prevPropValueFn);
								}
							}
						}
						else {
							needsSort = (privateProp === privatePrevProp) && (propUpperCase === prevPropUpperCase) && naturalCompare(propName, prevPropName, true) === -1 && prevPropValueFn === propValueFn;
						}

						if (re.REGEX_SERVICE_PROPS.test(propName) || re.REGEX_SERVICE_PROPS.test(prevPropName)) {
							needsSort = false;
						}

						if (needsSort) {
							var note = lifecyleMethod ? '(Lifecycle methods should come first)' : '';

							var message = base.sub('Sort properties: {0} {1} {2}', prevPropName, propName, note).warn;

							context.report(node, message);
						}
					}

					prev = item;
				}
			);
		}
	};
};