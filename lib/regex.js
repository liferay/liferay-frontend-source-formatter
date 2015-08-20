var base = require('./base');

var REGEX = {
	ARRAY_INTERNAL_SPACE: /[^,]*?,((?! )| {2,})[^,]+?/g,
	ARRAY_SURROUNDING_SPACE: /\[\s|\s\]/g,

	AUI_SCRIPT: /<(aui:)?script(.*?)>([\s\S]*?)<\/\1script>/,

	BRACE_CLOSING: /\}\s*?$/,
	BRACE_OPENING: /\{\s*?$/,

	CSS_COMMA_END: /,\s*?$/,

	DIGITS: /\d+/,

	HEX: /#[0-9A-Fa-f]{3,6}\b/,
	HEX_REDUNDANT: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,

	LANG_EMPTYFN: /(^|(A\.)?(Lang\.)?)emptyFn(True|False)?/,

	LEADING_INCLUDE: /^@include /,
	LEADING_SPACE: /^\s+/,

	PROP_KEY: /^\s*(?:@include\s)?([^:]+)(?:)/,
	PROPERTY: /^\t*([^:]+:|@include\s)[^;]+;$/,

	REGEX: /\/.*\/([gim]{1,3})?/g,

	SCRIPTLET_STUB: new RegExp('^\\s*' + base.jspLintStubs.scriptlet + '$'),

	SERVICE_PROPS: /(^@)|((.*?) = (.*?))/,

	STUBS: new RegExp('^_*(' + Object.keys(base.stubs).join('|') + ')_*'),

	STYLE: /<(style)(.*?)>([\s\S]*?)<\/\1>/,

	VAR_IS: /^_?is[A-Z]/,

	REPLACE_HEX_REDUNDANT: '#$1$2$3',
};

module.exports = REGEX;