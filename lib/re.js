var _ = require('lodash');
var getObject = require('getobject');
var base = require('./base');

var sub = base.sub;

var RULES = {
	REGEX_ARRAY_INTERNAL_SPACE: /[^,]*?,((?! )| {2,})[^,]+?/g,
	REGEX_ARRAY_SURROUNDING_SPACE: /\[\s|\s\]/g,

	REGEX_AUI_SCRIPT: /<(aui:)?script(.*?)>([\s\S]*?)<\/\1script>/,

	REGEX_BRACE_CLOSING: /\}\s*?$/,
	REGEX_BRACE_OPENING: /\{\s*?$/,

	REGEX_COMMA_LEADING: /^((?:\[|\{)\s*),/,
	REGEX_COMMA_TRAILING: /,(\s*(?:\]|\}))$/,

	REGEX_COMMENT: /\/(\/|\*).*/g,

	REGEX_CSS_COMMA_END: /,\s*?$/,

	REGEX_DIGITS: /\d+/,

	REGEX_EXT_CSS: /\.(s)?css$/,
	REGEX_EXT_HTML: /\.(jsp.?|html|vm|ftl|tpl|tmpl)$/,
	REGEX_EXT_JS: /\.js$/,

	REGEX_HEX: /#[0-9A-Fa-f]{3,6}\b/,
	REGEX_HEX_REDUNDANT: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,

	REGEX_LANG_EMPTYFN: /(^|(A\.)?(Lang\.)?)emptyFn(True|False)?/,

	REGEX_LEADING_INCLUDE: /^@include /,
	REGEX_LEADING_SPACE: /^\s+/,

	REGEX_PROP_KEY: /^\s*(?:@include\s)?([^:]+)(?:)/,
	REGEX_PROPERTY: /^\t*([^:]+:|@include\s)[^;]+;$/,

	REGEX_REGEX: /\/.*\/([gim]{1,3})?/g,

	REGEX_SCRIPTLET_STUB: new RegExp('^\\s*' + base.jspLintStubs.scriptlet + '$'),

	REGEX_SERVICE_PROPS: /(^@)|((.*?) = (.*?))/,
	REGEX_SINGLE_QUOTES: /'[^']*'/g,

	REGEX_STUBS: new RegExp('^_*(' + Object.keys(base.stubs).join('|') + ')_*'),

	REGEX_VAR_IS: /^_?is[A-Z]/,

	REPLACE_REGEX_REDUNDANT: '#$1$2$3',

	common: require('./engine_rules/common'),
	css: require('./engine_rules/css'),

	html: {},

	htmlJS: require('./engine_rules/html_js'),
	js: require('./engine_rules/js')
};

var re = function(rules) {
	_.defaults(this, rules);
};

re.prototype.getValue = getObject.get;

re.prototype.getWarning = function(lineNum, item, result, rule, context) {
	var warning;

	var message = rule.message || this.message;

	if (rule.message === false) {
		message = false;
	}

	if (_.isString(message)) {
		warning = this.message(message, lineNum, item, result, rule, context);
	}
	else if (_.isFunction(message)) {
		warning = message.call(this, lineNum, item, result, rule, context);
	}

	return warning;
};

re.prototype.hasExtraNewLines = function(item, index, collection, logger) {
	var extraNewLines = false;

	if (item === '') {
		extraNewLines = (index === 0) || collection[index - 1] === '';
	}

	if (extraNewLines && logger) {
		logger(index + 1, 'Extra new line');
	}

	return extraNewLines;
};

re.prototype.hasHex = function(item) {
	var match = item.match(this.REGEX_HEX);

	return match && match[0];
};

re.prototype.hasProperty = function(item) {
	return this.REGEX_PROPERTY.test(item);
};

re.prototype.isValidRule = function(ruleName, rule, context) {
	return (ruleName !== 'IGNORE' && ruleName.indexOf('_') !== 0) &&
			(rule.ignore !== 'node' || !context.hasSheBang);
};

re.prototype.isValidRuleSet = function(rules, fullItem, context) {
	var validRuleSet = false;

	if (_.isObject(rules)) {
		var ignore = rules.IGNORE;
		var customIgnore = context.customIgnore;

		validRuleSet = (!ignore || (ignore && !ignore.test(fullItem))) &&
				(!customIgnore || (customIgnore && !customIgnore.test(fullItem)));
	}

	return validRuleSet;
};

re.prototype.iterateRules = function(rules, fullItem, context) {
	var instance = this;

	if (_.isString(rules)) {
		rules = instance.getValue(instance, rules);
	}

	var item = context.item;
	var lineNum = context.lineNum;
	var logger = context.logger;

	if (instance.isValidRuleSet(rules, fullItem, context)) {
		_.forEach(
			rules,
			function(rule, ruleName) {
				if (instance.isValidRule(ruleName, rule, context)) {
					var result = instance.testLine(rule, fullItem, context);

					if (result) {
						var warning = instance.getWarning(lineNum, item, result, rule, context);

						if (warning && logger) {
							logger(lineNum, warning);
						}

						fullItem = instance.replaceItem(lineNum, fullItem, result, rule, context);
					}
				}
			}
		);
	}

	return fullItem;
};

re.prototype.match = function(item, re) {
	return item.match(re);
};

re.prototype.message = function(message, lineNum, item, result, rule) {
	return sub(message, lineNum, item);
};

re.prototype.replaceItem = function(lineNum, fullItem, result, rule, context) {
	var replacer = rule.replacer;

	if (replacer) {
		if (_.isString(replacer)) {
			fullItem = fullItem.replace(rule.regex, replacer);
		}
		else if (_.isFunction(replacer)) {
			fullItem = replacer.call(this, fullItem, result, rule, context);
		}

		var formatItem = context.formatItem;

		if (formatItem) {
			fullItem = formatItem.call(this, fullItem, context);
		}
	}

	return fullItem;
};

re.prototype.test = function(item, regex) {
	return regex.test(item);
};

re.prototype.testLine = function(rule, fullItem, context) {
	var regex = rule.regex;
	var test = rule.test || this.test;

	if (test === 'match') {
		test = this.match;
	}

	var testItem = context.item;

	if (rule.testFullItem) {
		testItem = fullItem;
	}

	return test.call(this, testItem, regex, rule, context);
};

var rulesInstance = new re(RULES);

rulesInstance.re = re;

re.RULES = RULES;

module.exports = rulesInstance;