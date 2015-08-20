var _ = require('lodash');
var getObject = require('getobject');

var EventEmitter = require('drip').EnhancedEmitter;

var sub = require('string-sub');

var re = function(rules) {
	EventEmitter.call(this);

	var rulesets = {};

	_.assign(rulesets, rules);

	this.rules = rulesets;
};

re.prototype = _.create(
	EventEmitter.prototype,
	{
		constructor: re,

		getValue: getObject.get,

		getMessage: function(result, rule, context) {
			var warning;

			var message = rule.message || this.message;

			if (rule.message === false) {
				message = false;
			}

			if (_.isString(message)) {
				warning = this.message(message, result, rule, context);
			}
			else if (_.isFunction(message)) {
				warning = message.call(this, result, rule, context);
			}

			return warning;
		},

		isValidRule: function(ruleName, rule, context) {
			return (ruleName !== 'IGNORE' && ruleName.indexOf('_') !== 0) &&
					(!rule.valid || (_.isFunction(rule.valid) && rule.valid.call(this, rule, context)));
		},

		isValidRuleSet: function(rules, context) {
			var validRuleSet = false;

			if (_.isObject(rules)) {
				var ignore = rules.IGNORE;
				var customIgnore = context.customIgnore;
				var fullItem = context.fullItem;

				validRuleSet = (!ignore || (ignore && !ignore.test(fullItem))) &&
						(!customIgnore || (customIgnore && !customIgnore.test(fullItem)));
			}

			return validRuleSet;
		},

		iterateRules: function(rules, context) {
			var instance = this;

			if (_.isString(rules)) {
				rules = instance.getValue(instance.rules, rules);
			}

			var fullItem = context.fullItem;
			var lineNum = context.lineNum;

			if (instance.isValidRuleSet(rules, context)) {
				_.forEach(
					rules,
					function(rule, ruleName) {
						if (instance.isValidRule(ruleName, rule, context)) {
							var result = instance.testLine(rule, context);

							if (result) {
								var message = instance.getMessage(result, rule, context);

								if (message) {
									instance.emit(
										'message',
										{
											context: context,
											message: message
										}
									);
								}

								fullItem = instance.replaceItem(result, rule, context);
							}
						}
					}
				);
			}

			return fullItem;
		},

		match: function(item, re) {
			return item.match(re);
		},

		message: function(message, result, rule, context) {
			return sub(message, context.lineNum, context.item);
		},

		replaceItem: function(result, rule, context) {
			var replacer = rule.replacer;

			var fullItem = context.fullItem;

			if (replacer) {
				fullItem = this._callReplacer(result, rule, context);

				context.fullItem = fullItem;

				fullItem = this._callFormatItem(context);
			}

			return fullItem;
		},

		test: function(item, regex) {
			return regex.test(item);
		},

		testLine: function(rule, context) {
			var regex = rule.regex;
			var test = rule.test || this.test;

			if (test === 'match') {
				test = this.match;
			}

			var testItem = context.item;

			if (rule.testFullItem) {
				testItem = context.fullItem;
			}

			return test.call(this, testItem, regex, rule, context);
		},

		_callReplacer: function(result, rule, context) {
			var replacer = rule.replacer;
			var fullItem = context.fullItem;

			if (_.isString(replacer)) {
				fullItem = fullItem.replace(rule.regex, replacer);
			}
			else if (_.isFunction(replacer)) {
				fullItem = replacer.call(this, result, rule, context);
			}

			return fullItem;
		},

		_callFormatItem: function(context) {
			var fullItem = context.fullItem;
			var formatItem = context.formatItem;

			if (formatItem) {
				fullItem = formatItem.call(this, context);
			}

			return fullItem;
		}
	}
);

module.exports = re;