var colors = require('cli-color-keywords')();

var sub = require('string-sub');

var REGEX = require('../regex');

module.exports = {
	hexLowerCase: {
		message: 'Hex code should be all uppercase: {1}',
		regex: /[a-f]/,
		replacer: function(result, rule, context) {
			var rawContent = context.rawContent;

			var hexMatch = this.hasHex(rawContent);

			rawContent = rawContent.replace(hexMatch, hexMatch.toUpperCase());

			return rawContent;
		},
		test: function(content, regex) {
			var match = this.hasHex(content);

			return match && this.test(match, regex);
		}
	},

	hexRedundant: {
		message: function(result, rule, context) {
			var match = this.hasHex(context.content);

			var message = 'Hex code can be reduced to ' + rule._reduceHex(match) + ': {1}';

			return this.message(message, result, rule, context);
		},
		regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
		replacer: function(result, rule, context) {
			var rawContent = context.rawContent;

			var hexMatch = this.hasHex(rawContent);

			rawContent = rawContent.replace(hexMatch, rule._reduceHex.call(this, hexMatch));

			return rawContent;
		},
		test: function(content, regex) {
			var match = this.hasHex(content);

			return match && this.test(match, regex);
		},
		_reduceHex: function(hex) {
			return hex.replace(REGEX.HEX_REDUNDANT, REGEX.REPLACE_HEX_REDUNDANT);
		}
	},

	missingInteger: {
		message: 'Missing integer: {1}',
		regex: /([^0-9])(\.\d+)/g,
		replacer: '$10$2'
	},

	missingListValuesSpace: {
		message: 'Needs space between comma-separated values: {1}',
		regex: /,(?=[^\s])/g,
		replacer: ', ',
		test: function(content, regex) {
			var needsSpace = this.test(content, regex);

			if (this.hasProperty(content)) {
				var value = content.match(REGEX.PROP_KEY);

				needsSpace = needsSpace && value[1].trim() !== 'content';
			}

			return needsSpace;
		}
	},

	missingNewlines: {
		message: function(result, rule, context) {
			var message = 'There should be a newline between "{prevRule}" and "{rule}"';

			message = this.message(message, result, rule, context);

			return sub(
				message,
				{
					rule: context.nextItem.trim(),
					prevRule: context.previousItem.trim()
				}
			);
		},
		regex: /.*?(\}|\{)/,
		replacer: function(result, rule, context) {
			var rawContent = context.rawContent;

			return rawContent.replace(
				rule.regex,
				function(m, bracket) {
					if (bracket == '{') {
						m = '\n' + m;
					}

					return m;
				}
			);
		},
		test: function(content, regex, rule, context) {
			var missingNewlines = false;

			var hasCloser = REGEX.BRACE_CLOSING.test(content);
			var hasOpener = REGEX.BRACE_OPENING.test(content);

			var previousItem = (context.previousItem || '').trim();
			var nextItem = (context.nextItem || '').trim();

			if ((hasCloser && rule._isNextLineInvalid.call(this, nextItem)) ||
				(hasOpener && rule._isPrevLineInvalid.call(this, previousItem) && content.indexOf('@else') !== 0)) {
				missingNewlines = true;
			}

			return missingNewlines;
		},

		_isNextLineInvalid: function(content) {
			return (content !== '' && !REGEX.BRACE_CLOSING.test(content) && content.indexOf('@') !== 0);
		},

		_isPrevLineInvalid: function(content) {
			return (content !== '' && !REGEX.BRACE_OPENING.test(content) && !REGEX.CSS_COMMA_END.test(content));
		}
	},

	missingSelectorSpace: {
		message: 'Missing space between selector and bracket: {1}',
		regex: /([^ ])\{\s*$/
	},

	needlessQuotes: {
		message: 'Needless quotes: {1}',
		regex: /url\((["'])(.*?)\1\)/,
		replacer: 'url($2)'
	},

	needlessUnit: {
		message: 'Needless unit: {1}',
		regex: /(#?)(\b0(?!s\b)[a-zA-Z]{1,}\b)/,
		replacer: '0',
		test: function(content, regex) {
			var m = content.match(regex);

			return m && !m[1];
		}
	},

	trailingNewlines: {
		PRECEDING: 1,
		TRAILING: 2,
		message: function(result, rule, context) {
			var offset = 1;

			if (result == rule.PRECEDING) {
				offset = -1;
			}

			context.lineNum += offset;

			return this.message('Needless new line', result, rule, context);
		},
		test: function(content, regex, rule, context) {
			var hasCloser = REGEX.BRACE_CLOSING.test(content);
			var hasOpener = REGEX.BRACE_OPENING.test(content);

			var previousItem = context.previousItem;
			var nextItem = context.nextItem;

			var trailingNewlines = false;

			if (hasCloser && (previousItem === '')) {
				trailingNewlines = rule.PRECEDING;
			}
			else if (hasOpener && (nextItem === '')) {
				var afterNextLine = context.collection[context.index + 2];

				if (!afterNextLine || (afterNextLine && afterNextLine.trim().indexOf('/*') !== 0)) {
					trailingNewlines = rule.TRAILING;
				}
			}

			return trailingNewlines;
		}
	},

	trailingComma: {
		message: 'Trailing comma in selector',
		regex: /,(\s*\{)\s*$/,
		replacer: '$1'
	},

	_properties: {
		invalidBorderReset: {
			message: function(result, rule, context) {
				var borderReplacement = rule._getValidReplacement(result);

				var message = sub('You should use "{1}": {0}', context.content, colors.error(borderReplacement));

				return this.message(message, result, rule, context);
			},
			regex: /(border(-(?:right|left|top|bottom))?):\s?(none|0)(\s?(none|0))?;/,
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				return rawContent.replace(result[0], rule._getValidReplacement(result));
			},
			test: 'match',
			_getValidReplacement: function(result) {
				return '' + result[1] + '-width: 0;';
			}
		},

		invalidFormat: {
			message: 'There should be one space after ":": {1}',
			regex: /^\t*([^:]+:(?:(?! )|(?= {2,})))[^;]+;$/,
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				return rawContent.replace(/:\s*/, ': ');
			},
			test: function(content, regex) {
				return content.indexOf(':') > -1 && regex.test(content);
			}
		}
	}
};