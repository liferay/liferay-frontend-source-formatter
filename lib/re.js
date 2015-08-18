var _ = require('lodash');
var getObject = require('getobject');
var base = require('./base');

var RULES = {
	common: require('./engine_rules/common'),
	css: require('./engine_rules/css'),

	html: require('./engine_rules/html'),

	htmlJS: require('./engine_rules/html_js'),
	js: require('./engine_rules/js')
};

var REGEX = {
	REGEX_ARRAY_INTERNAL_SPACE: /[^,]*?,((?! )| {2,})[^,]+?/g,
	REGEX_ARRAY_SURROUNDING_SPACE: /\[\s|\s\]/g,

	REGEX_AUI_SCRIPT: /<(aui:)?script(.*?)>([\s\S]*?)<\/\1script>/,

	REGEX_BRACE_CLOSING: /\}\s*?$/,
	REGEX_BRACE_OPENING: /\{\s*?$/,

	REGEX_CSS_COMMA_END: /,\s*?$/,

	REGEX_DIGITS: /\d+/,

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

	REGEX_STUBS: new RegExp('^_*(' + Object.keys(base.stubs).join('|') + ')_*'),

	REGEX_STYLE: /<(style)(.*?)>([\s\S]*?)<\/\1>/,

	REGEX_VAR_IS: /^_?is[A-Z]/,

	REPLACE_REGEX_REDUNDANT: '#$1$2$3',
};

var re = require('./re_base');

re.prototype.hasExtraNewLines = function(item, index, collection, logger) {
	var extraNewLines = false;

	if (item === '') {
		extraNewLines = (index === 0 && collection.length > 1) || collection[index - 1] === '';
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

var rulesInstance = new re(RULES);

_.assign(rulesInstance, REGEX);

rulesInstance.re = re;

re.RULES = RULES;

module.exports = rulesInstance;