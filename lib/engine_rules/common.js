var colors = require('cli-color-keywords')();

var MAP_WHITESPACE = {
	'\xa0': ' ',
	'\x95': '',
	'\x99': ''
};

var REGEX_WHITESPACE_CHARS = new RegExp('(' + Object.keys(MAP_WHITESPACE).join('|') + ')', 'g');

module.exports = {
	mixedSpaces: {
		message: 'Mixed spaces and tabs: {1}',
		regex: /^.*( \t|\t ).*$/,
		replacer: function(result, rule, context) {
			var rawContent = context.rawContent;

			rawContent = rawContent.replace(
				/(.*)( +\t|\t +)(.*)/g,
				function(str, prefix, problem, suffix) {
					problem = problem.replace(/ {4}| {2}/g, '\t').replace(/ /g, '');

					return prefix + problem + suffix;
				}
			);

			return rawContent;
		},
		testProp: 'rawContent'
	},
	invalidWhiteSpace: {
		MSG: 'Invalid whitespace characters',
		message: function(result, rule, context) {
			var content = context.content;

			var displayedContent = content.replace(
				new RegExp(rule.regex.source, 'g'),
				colors.bgError('$1')
			);

			context.content = displayedContent;

			return this.message(rule.MSG + ': {1}', result, rule, context);
		},
		regex: REGEX_WHITESPACE_CHARS,
		replacer: function(result, rule, context) {
			var rawContent = context.rawContent;

			return rawContent.replace(
				rule.regex,
				function(str, m) {
					return MAP_WHITESPACE[m];
				}
			);
		},
		testProp: 'rawContent'
	},
	_MAP_WHITESPACE: MAP_WHITESPACE
};