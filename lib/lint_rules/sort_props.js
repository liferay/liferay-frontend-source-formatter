var _ = require('lodash');
var base = require('../base');
var re = require('../re');

var ruleUtils = require('../rule_utils');

var isPrivate = function(str) {
	return _.isString(str) && str.charAt(0) === '_';
};

var LIFECYCLE_METHODS = {
	init: -1100,
	initializer: -1000,
	renderUI: -900,
	bindUI: -800,
	syncUI: -700,
	destructor: -600
};

var naturalCompare = ruleUtils.naturalCompare;

module.exports = function(context) {
	var configuration = context.options[0] || {};
	var caseSensitive = configuration.casesensitive;

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

						var propValueFn = (item.value.type === 'FunctionExpression');
						var prevPropValueFn = (prev.value.type === 'FunctionExpression');

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
							needsSort = (privateProp === privatePrevProp) && (propUpperCase === prevPropUpperCase) && naturalCompare(propName, prevPropName, !caseSensitive) === -1 && prevPropValueFn === propValueFn;
						}

						if (re.REGEX_SERVICE_PROPS.test(propName) || re.REGEX_SERVICE_PROPS.test(prevPropName)) {
							needsSort = false;
						}

						if (needsSort) {
							var note = lifecyleMethod ? ' (Lifecycle methods should come first)' : '';

							var message = base.sub('Sort properties: {0} {1}{2}', prevPropName, propName, note);

							context.report(item, message);
						}
					}

					prev = item;
				}
			);
		}
	};
};