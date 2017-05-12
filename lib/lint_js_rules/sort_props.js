var _ = require('lodash');

var REGEX = require('../regex');

var sub = require('string-sub');

var ruleUtils = require('../rule_utils');

module.exports = context => {
	var LIFECYCLE_METHODS = {
		init: -1100,
		initializer: -1000,
		renderUI: -900,
		bindUI: -800,
		syncUI: -700,
		destructor: -600
	};

	var getCacheKey = (...args) => args.join('_');

	// Recursive function for collection node values
	// var getVals = function(obj, arr) {
	// 	var type = obj.type;

	// 	if (type === 'BinaryExpression') {
	// 		arr = getVals(obj.left, arr);
	// 		arr = getVals(obj.right, arr);
	// 	}
	// 	else if (type === 'Literal') {
	// 		arr.push(obj.value);
	// 	}
	// 	else if (type === 'Identifier') {
	// 		arr.push(obj.name);
	// 	}
	// 	else if (type === 'CallExpression') {
	// 		arr = getVals(obj.callee, arr);
	// 	}
	// 	else if (type === 'MemberExpression') {
	// 		arr = getVals(obj.object, arr);
	// 		arr = getVals(obj.property, arr);
	// 	}

	// 	return arr;
	// };

	// var getPropertyNames = function(node, names) {
	// 	names = names || [];

	// 	if (node.type === 'MemberExpression') {
	// 		var obj = node.object;

	// 		if (obj.type === 'Identifier') {
	// 			names.push(obj.name);
	// 		}
	// 		else if (obj.type === 'MemberExpression') {
	// 			names = getPropertyNames(obj, names);
	// 		}

	// 		names.push(node.property.name);
	// 	}

	// 	return names;
	// };

	var getPropName = obj => {
		var propName = '';

		// propName = getVals(obj, []).join('');

		var type = obj.type;

		if (type === 'Literal' || type === 'Identifier') {
			propName = obj.name || obj.value;
		}
		else {
			propName = context.getSourceCode().getText(obj);
		}

		// if (type === 'Literal' || type === 'Identifier') {
		// 	propName = obj.name || obj.value;
		// }
		// if (type === 'CallExpression') {
		// 	if (obj.callee.type === 'Identifier') {
		// 		propName = obj.callee.name;
		// 	}
		// 	else if (obj.callee.type === 'MemberExpression') {
		// 		propName = getPropertyNames(obj.callee).join('.');
		// 	}
		// }
		// else if (type === 'MemberExpression') {
		// 	propName = getPropertyNames(obj).join('.');
		// }
		// else if (type === 'BinaryExpression') {

		// 	console.log(context.getSourceCode().getText(obj));
		// }

		return propName;
	};

	var sourceCode = context.getSourceCode();

	var getComputedPropertyName = obj => sourceCode.getTokenBefore(obj).value + sourceCode.getText(obj) + sourceCode.getTokenAfter(obj).value;

	var inAttrs = parent => {
		var insideAttrs = false;

		var grandParent = parent && parent.parent;

		if (grandParent && grandParent.type === 'Property' && grandParent.key.name === 'ATTRS') {
			insideAttrs = true;
		}

		return insideAttrs;
	};

	var isFunctionExpression = obj => obj.type === 'FunctionExpression' || obj.type === 'ArrowFunctionExpression';

	var isLifecycle = _.memoize(
		(propName, prevPropName) => LIFECYCLE_METHODS.hasOwnProperty(propName) || LIFECYCLE_METHODS.hasOwnProperty(prevPropName),
		getCacheKey
	);

	var isMatchingCase = _.memoize(
		(propName, prevPropName) => isUpper(propName) === isUpper(prevPropName),
		getCacheKey
	);

	var isMatchingType = (item, prev) => isFunctionExpression(prev.value) === isFunctionExpression(item.value);

	var isPrivate = _.memoize(
		str => _.isString(str) && str.charAt(0) === '_'
	);

	var RE_UPPER = /^[^a-z]+$/;

	var isUpper = _.memoize(
		str => RE_UPPER.test(str)
	);

	var naturalCompare = ruleUtils.naturalCompare;

	var configuration = context.options[0] || {};
	var caseSensitive = configuration.casesensitive;

	var checkLifecyleSort = (needsSort, propName, prevPropName, item, prev, parent) => {
		var customPropName = LIFECYCLE_METHODS[propName];
		var customPrevPropName = LIFECYCLE_METHODS[prevPropName];

		if (customPropName) {
			if (customPrevPropName) {
				needsSort = customPropName < customPrevPropName;
			}
			else {
				needsSort = (!isUpper(prevPropName) && isFunctionExpression(prev.value));
			}
		}

		return needsSort;
	};

	var checkRegPropSort = (needsSort, propName, prevPropName, item, prev, caseSensitive, parent) => {
		var privateProp = isPrivate(propName);
		var privatePrevProp = isPrivate(prevPropName);

		needsSort = (privateProp === privatePrevProp) && isMatchingCase(propName, prevPropName) && naturalCompare(propName, prevPropName, !caseSensitive) === -1 && isMatchingType(item, prev);

		if (privateProp !== privatePrevProp && privatePrevProp && !privateProp) {
			needsSort = true;
		}

		if (needsSort && !isFunctionExpression(item.value) && !inAttrs(parent)) {
			// Allow a set of properties to be grouped with an extra newline
			needsSort = (item.loc.start.line - prev.loc.end.line) < 2;
		}

		return needsSort;
	};

	var checkSort = (propName, prevPropName, item, prev, caseSensitive, parent) => {
		var needsSort = false;

		if (isLifecycle(propName, prevPropName)) {
			needsSort = checkLifecyleSort(needsSort, propName, prevPropName, item, prev, parent);
		}
		else {
			needsSort = checkRegPropSort(needsSort, propName, prevPropName, item, prev, caseSensitive, parent);
		}

		if (REGEX.SERVICE_PROPS.test(propName) || REGEX.SERVICE_PROPS.test(prevPropName)) {
			needsSort = false;
		}

		return needsSort;
	};

	return {
		ObjectExpression(node) {
			var prev = null;

			node.properties.forEach(
				(item, index, collection) => {
					if (index > 0 && item.type !== 'ExperimentalSpreadProperty' && prev.type !== 'ExperimentalSpreadProperty') {
						var key = item.key;
						var prevKey = prev.key;

						var propName = getPropName(key);
						var prevPropName = getPropName(prevKey);

						var needsSort = checkSort(propName, prevPropName, item, prev, caseSensitive, node);

						if (needsSort) {
							var note = isLifecycle(propName, prevPropName) ? ' (Lifecycle methods should come first)' : '';

							var displayPropName = propName;
							var displayPrevPropName = prevPropName;

							if (item.computed) {
								displayPropName = getComputedPropertyName(key);
								displayPrevPropName = getComputedPropertyName(prevKey);
							}

							var message = sub('Sort properties: {0} {1}{2}', displayPrevPropName, displayPropName, note);

							context.report(item, message);
						}
					}

					prev = item;
				}
			);
		}
	};
};