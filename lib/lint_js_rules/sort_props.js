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

	var getPropName = obj => {
		var propName = '';

		var type = obj.type;

		if (type === 'Literal' || type === 'Identifier') {
			propName = obj.name || obj.value;
		}
		else {
			propName = context.getSourceCode().getText(obj);
		}

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
		var customPrevPropName = LIFECYCLE_METHODS[prevPropName];
		var customPropName = LIFECYCLE_METHODS[propName];

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
		var privatePrevProp = isPrivate(prevPropName);
		var privateProp = isPrivate(propName);

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

						var prevPropName = getPropName(prevKey);
						var propName = getPropName(key);

						var needsSort = checkSort(propName, prevPropName, item, prev, caseSensitive, node);

						if (needsSort) {
							var note = isLifecycle(propName, prevPropName) ? ' (Lifecycle methods should come first)' : '';

							var displayPrevPropName = prevPropName;
							var displayPropName = propName;

							if (item.computed) {
								displayPrevPropName = getComputedPropertyName(prevKey);
								displayPropName = getComputedPropertyName(key);
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