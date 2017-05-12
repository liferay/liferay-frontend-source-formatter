var REGEX = require('../regex');

var REGEX_WHITESPACE = /\s/;

module.exports = {
	hexLowerCase: {
		message: false,
		regex: /[a-f]/,
		replacer(result, rule, context) {
			var rawContent = context.rawContent;

			var hexMatch = this.hasHex(rawContent);

			rawContent = rawContent.replace(hexMatch, hexMatch.toUpperCase());

			return rawContent;
		},
		test(content, regex) {
			var match = this.hasHex(content);

			return match && this.test(match, regex);
		}
	},

	hexRedundant: {
		message: false,
		regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
		replacer(result, rule, context) {
			var rawContent = context.rawContent;

			var hexMatch = this.hasHex(rawContent);

			rawContent = rawContent.replace(hexMatch, rule._reduceHex.call(this, hexMatch));

			return rawContent;
		},
		test(content, regex) {
			var match = this.hasHex(content);

			return match && this.test(match, regex);
		},
		_reduceHex(hex) {
			return hex.replace(REGEX.HEX_REDUNDANT, REGEX.REPLACE_HEX_REDUNDANT);
		}
	},

	missingInteger: {
		message: false,
		regex: /([^0-9])(\.\d+)/g,
		replacer: '$10$2'
	},

	missingListValuesSpace: {
		message: false,
		regex: /,(?=[^\s])/g,
		replacer: ', ',
		test(content, regex) {
			var needsSpace = this.test(content, regex);

			if (this.hasProperty(content)) {
				var value = content.match(REGEX.PROP_KEY);

				needsSpace = needsSpace && value[1].trim() !== 'content';
			}

			return needsSpace;
		}
	},

	missingNewlines: {
		message: false,
		regex: /.*?(\}|\{)/,
		replacer(result, rule, context) {
			var rawContent = context.rawContent;

			return rawContent.replace(
				rule.regex,
				(m, bracket) => {
					if (bracket == '{') {
						m = `\n${m}`;
					}

					return m;
				}
			);
		},
		test(content, regex, rule, context) {
			var missingNewlines = false;

			var hasCloser = REGEX.BRACE_CLOSING.test(content);
			var hasOpener = REGEX.BRACE_OPENING.test(content);

			var nextItem = (context.nextItem || '').trim();
			var previousItem = (context.previousItem || '').trim();

			if ((hasCloser && rule._isNextLineInvalid.call(this, nextItem)) ||
				(hasOpener && rule._isPrevLineInvalid.call(this, previousItem) && content.indexOf('@else') !== 0)) {
				missingNewlines = true;
			}

			return missingNewlines;
		},

		_isNextLineInvalid(content) {
			return (content !== '' && !REGEX.BRACE_CLOSING.test(content) && content.indexOf('@') !== 0);
		},

		_isPrevLineInvalid(content) {
			return (content !== '' && !REGEX.BRACE_OPENING.test(content) && !REGEX.CSS_COMMA_END.test(content));
		}
	},

	missingSelectorSpace: {
		message: false,
		regex: /([^ ])\{\s*$/
	},

	missingInternalSelectorSpace: {
		message: false,
		regex: /(.)?([>~+])(.)?/g,
		replacer(result, rule, context) {
			var item = context.rawContent;

			if (!this.hasProperty(item)) {
				item = context.rawContent.replace(
					rule.regex,
					(m, before, combinator, after) => {
						if (rule._hasCombinator(before, after)) {
							if (before && !REGEX_WHITESPACE.test(before)) {
								before += ' ';
							}

							if (!REGEX_WHITESPACE.test(after)) {
								after = ` ${after}`;
							}
						}

						return (before || '') + combinator + after;
					}
				);
			}

			return item;
		},
		test(item, regex, rule, context) {
			var hasCombinator = false;

			if (!this.hasProperty(item) && regex.test(item)) {
				item.replace(
					regex,
					(m, before, combinator, after) => {
						if (!hasCombinator) {
							hasCombinator = rule._hasCombinator(before, after);
						}
					}
				);
			}

			return hasCombinator;
		},
		_hasCombinator(before, after) {
			return after !== '=' && ((before && !REGEX_WHITESPACE.test(before)) || !REGEX_WHITESPACE.test(after));
		}
	},

	needlessQuotes: {
		message: false,
		regex: /url\((["'])(.*?)\1\)/,
		replacer: 'url($2)'
	},

	needlessUnit: {
		message: false,
		regex: /(#?)(\b0(?!s\b)[a-zA-Z]{1,}\b)/,
		replacer: '0',
		test(content, regex) {
			var m = content.match(regex);

			return m && !m[1];
		}
	},

	trailingNewlines: {
		PRECEDING: 1,
		TRAILING: 2,
		message(result, rule, context) {
			var offset = 1;

			if (result == rule.PRECEDING) {
				offset = -1;
			}

			context.lineNum += offset;

			return this.message('Needless new line', result, rule, context);
		},
		test(content, regex, rule, context) {
			var hasCloser = REGEX.BRACE_CLOSING.test(content);
			var hasOpener = REGEX.BRACE_OPENING.test(content);

			var nextItem = context.nextItem;
			var previousItem = context.previousItem;

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
			message: false,
			regex: /(border(-(?:right|left|top|bottom))?):\s?(none|0)(\s?(none|0))?;/,
			replacer(result, rule, context) {
				var rawContent = context.rawContent;

				return rawContent.replace(result[0], rule._getValidReplacement(result));
			},
			test: 'match',
			_getValidReplacement(result) {
				return `${result[1]}-width: 0;`;
			}
		},

		invalidFormat: {
			message: false,
			regex: /^\t*([^:]+:(?:(?! )|(?= {2,})))[^;]+;$/,
			replacer(result, rule, context) {
				var rawContent = context.rawContent;

				return rawContent.replace(/:\s*/, ': ');
			},
			test(content, regex) {
				return content.indexOf(':') > -1 && regex.test(content);
			}
		}
	}
};