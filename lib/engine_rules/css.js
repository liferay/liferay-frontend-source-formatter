var colors = require('cli-color-keywords')();

var sub = require('string-sub');

module.exports = {
	hexLowerCase: {
		message: 'Hex code should be all uppercase: {1}',
		regex: /[a-f]/,
		replacer: function(result, rule, context) {
			var fullItem = context.fullItem;

			var hexMatch = this.hasHex(fullItem);

			fullItem = fullItem.replace(hexMatch, hexMatch.toUpperCase());

			return fullItem;
		},
		test: function(item, regex) {
			var match = this.hasHex(item);

			return match && this.test(match, regex);
		}
	},

	hexRedundant: {
		message: function(result, rule, context) {
			var match = this.hasHex(context.item);

			var message = 'Hex code can be reduced to ' + rule._reduceHex(match) + ': {1}';

			return this.message(message, result, rule, context);
		},
		regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
		replacer: function(result, rule, context) {
			var fullItem = context.fullItem;

			var hexMatch = this.hasHex(fullItem);

			fullItem = fullItem.replace(hexMatch, rule._reduceHex.call(this, hexMatch));

			return fullItem;
		},
		test: function(item, regex) {
			var match = this.hasHex(item);

			return match && this.test(match, regex);
		},
		_reduceHex: function(hex) {
			return hex.replace(this.REGEX_HEX_REDUNDANT, this.REPLACE_HEX_REDUNDANT);
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
		test: function(item, regex) {
			var needsSpace = this.test(item, regex);

			if (this.hasProperty(item)) {
				var value = item.match(this.REGEX_PROP_KEY);

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
			var fullItem = context.fullItem;

			return fullItem.replace(
				rule.regex,
				function(m, bracket) {
					if (bracket == '{') {
						m = '\n' + m;
					}

					return m;
				}
			);
		},
		test: function(item, regex, rule, context) {
			var missingNewlines = false;

			var hasCloser = this.REGEX_BRACE_CLOSING.test(item);
			var hasOpener = this.REGEX_BRACE_OPENING.test(item);

			var previousItem = (context.previousItem || '').trim();
			var nextItem = (context.nextItem || '').trim();

			if ((hasCloser && rule._isNextLineInvalid.call(this, nextItem)) ||
				(hasOpener && rule._isPrevLineInvalid.call(this, previousItem) && item.indexOf('@else') !== 0)) {
				missingNewlines = true;
			}

			return missingNewlines;
		},

		_isNextLineInvalid: function(item) {
			return (item !== '' && !this.REGEX_BRACE_CLOSING.test(item) && item.indexOf('@') !== 0);
		},

		_isPrevLineInvalid: function(item) {
			return (item !== '' && !this.REGEX_BRACE_OPENING.test(item) && !this.REGEX_CSS_COMMA_END.test(item));
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
		test: function(item, regex) {
			var m = item.match(regex);

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
		test: function(item, regex, rule, context) {
			var hasCloser = this.REGEX_BRACE_CLOSING.test(item);
			var hasOpener = this.REGEX_BRACE_OPENING.test(item);

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

				var message = sub('You should use "{1}": {0}', context.item, colors.error(borderReplacement));

				return this.message(message, result, rule, context);
			},
			regex: /(border(-(?:right|left|top|bottom))?):\s?(none|0)(\s?(none|0))?;/,
			replacer: function(result, rule, context) {
				var fullItem = context.fullItem;

				return fullItem.replace(result[0], rule._getValidReplacement(result));
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
				var fullItem = context.fullItem;

				return fullItem.replace(/:\s*/, ': ');
			},
			test: function(item, regex) {
				return item.indexOf(':') > -1 && regex.test(item);
			}
		}
	}
};