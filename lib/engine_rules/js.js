var sub = require('../base').sub;

module.exports = {
	IGNORE: /^(\t| )*(\*|\/\/)/,

	elseFormat: {
		message: false,
		regex: /^(\s+)?\} ?(else|catch|finally)/,
		replacer: '$1}\n$1$2',
		test: 'match',
		testFullItem: true
	},

	invalidArgumentFormat: {
		message: 'These arguments should each be on their own line: {1}',
		regex: /(\w+)\((?!(?:$|.*?\);?))/,
		test: function(item, regex) {
			var invalid = false;

			item.replace(
				regex,
				function(str, fnName) {
					if (fnName !== 'function') {
						invalid = true;
					}
				}
			);

			return invalid;
		}
	},

	invalidConditional: {
		message: function(lineNum, item, result, rule) {
			var message = 'Needs a space between ")" and "{bracket}": {1}';

			return sub(this.message(message, lineNum, item, rule), rule._bracket);
		},
		regex: /\)\{(?!\})/,
		replacer: ') {',
		test: function(item, regex) {
			item = item.replace(this.REGEX_REGEX, '');

			return regex.test(item);
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

	liferayLanguageVar: {
		message: 'You should never pass variables to Liferay.Language.get(): {1}',
		regex: /Liferay\.Language\.get\((?!['"\)])/
	},

	logging: {
		ignore: 'node',
		message: 'Debugging statement: {1}',
		regex: /\bconsole\.[^\(]+?\(/
	},

	varLineSpacing: {
		message: 'Variable declaration needs a new line after it: {1}',
		regex: /^(\s*?)?var\b\s/,
		test: function(item, regex, rule, context) {
			var nextLineEmpty = context.nextItem == '';
			var nextLineHasVar = this.test(context.nextItem, regex);

			var nextLineValid = (nextLineEmpty || nextLineHasVar);

			return this.test(item, /;$/) && this.test(item, regex) && !nextLineValid;
		}
	}
};