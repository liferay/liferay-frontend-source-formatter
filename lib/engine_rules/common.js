var colors = require('cli-color-keywords')();

var MAP_WHITESPACE = {
	'\x95': '',
	'\x99': '',
	'\xa0': ' '
};

var REGEX_WHITESPACE_CHARS = new RegExp(`(${Object.keys(MAP_WHITESPACE).join('|')})`, 'g');

module.exports = {
	extraneousSpaces: {
		message: 'Extraneous whitespace at the end of the line',
		regex: /\s+$/,
		replacer(result, rule, context) {
			return '';
		},
		test(content, regex) {
			var invalid = this.test(content, regex);

			return invalid;
		},
		testProp: 'rawContent'
	},

	mixedSpaces: {
		message: 'Mixed spaces and tabs: {1}',
		regex: /^.*( \t|\t ).*$/,
		replacer(result, rule, context) {
			var rawContent = context.rawContent;

			rawContent = rawContent.replace(
				/(.*)( +\t|\t +)(.*)/g,
				(str, prefix, problem, suffix) => {
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
		message(result, rule, context) {
			var content = context.content;

			var displayedContent = content.replace(
				new RegExp(rule.regex.source, 'g'),
				colors.bgError('$1')
			);

			context.content = displayedContent;

			return this.message(`${rule.MSG}: {1}`, result, rule, context);
		},
		regex: REGEX_WHITESPACE_CHARS,
		replacer(result, rule, context) {
			var rawContent = context.rawContent;

			return rawContent.replace(
				rule.regex,
				(str, m) => MAP_WHITESPACE[m]
			);
		},
		testProp: 'rawContent'
	},
	_MAP_WHITESPACE: MAP_WHITESPACE
};