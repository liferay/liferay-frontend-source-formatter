var sub = require('string-sub');

var REGEX = require('../regex');

module.exports = {
	IGNORE: /^(\t| )*(\*|\/\/)/,

	elseFormat: {
		message: false,
		regex: /^(\s+)?\} ?(else|catch|finally)/,
		replacer: '$1}\n$1$2',
		test: 'match',
		testProp: 'rawContent'
	},

	invalidArgumentFormat: {
		message: 'These arguments should each be on their own line: {1}',
		regex: /(\w+)\((?!(?:$|.*?\);?))/,
		test(content, regex) {
			var invalid = false;

			content.replace(
				regex,
				(str, fnName) => {
					if (fnName !== 'function') {
						invalid = true;
					}
				}
			);

			return invalid;
		}
	},

	invalidConditional: {
		message(result, rule, context) {
			var message = 'Needs a space between ")" and "{bracket}": {1}';

			return sub(this.message(message, result, rule, context), rule._bracket);
		},
		regex: /\)\{(?!\})/,
		replacer: ') {',
		test(content, regex) {
			content = content.replace(REGEX.REGEX, '');

			return regex.test(content);
		},
		_bracket: {
			bracket: '{'
		}
	},

	invalidFunctionFormat: {
		message: 'Anonymous function expressions should be formatted as function(: {1}',
		regex: /function\s+\(/,
		replacer: 'function('
	},

	keywordFormat: {
		message: false,
		regex: /\b(try|catch|if|for|else|switch|while)(\(|\{)/,
		replacer: '$1 $2',
		test: 'match'
	},

	logging: {
		message: false,
		regex: /\bconsole\.[^\(]+?\(/,
		valid(rule, context) {
			return !context.hasSheBang;
		}
	},

	varLineSpacing: {
		message: 'Variable declaration needs a new line after it: {1}',
		regex: /^(\s*?)?var\b\s/,
		test(content, regex, rule, context) {
			var nextLineEmpty = context.nextItem == '';
			var nextLineHasVar = this.test(context.nextItem, regex);

			var nextLineValid = (nextLineEmpty || nextLineHasVar);

			return this.test(content, /;$/) && this.test(content, regex) && !nextLineValid;
		}
	}
};