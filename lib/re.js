var base = require('./base');

var A = base.A;

var sub = base.sub;

var re = {
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

	REGEX_LEADING_INCLUDE: /^@include /,
	REGEX_LEADING_SPACE: /^\s+/,

	REGEX_PROP_KEY: /^\s*(?:@include\s)?([^:]+)(?:)/,
	REGEX_PROPERTY: /^\t*([^:]+:|@include\s)[^;]+;$/,

	REGEX_REGEX: /\/.*\/([gim]{1,3})?/g,
	REGEX_SINGLE_QUOTES: /'[^']*'/g,

	REGEX_VAR_IS: /^_?is[A-Z]/,

	REPLACE_REGEX_REDUNDANT: '#$1$2$3',

	common: {
		mixedSpaces: {
			message: 'Mixed spaces and tabs: {1}',
			regex: /^.*( \t|\t ).*$/,
			replacer: function(fullItem, result, rule) {
				fullItem = fullItem.replace(
					/(.*)( +\t|\t +)(.*)/g,
					function(str, prefix, problem, suffix) {
						problem = problem.replace(/ {4}| {2}/g, '\t').replace(/ /g, '');

						return prefix + problem + suffix;
					}
				);

				return fullItem;
			},
			testFullItem: true
		}
	},

	css: {
		hexLowerCase: {
			message: 'Hex code should be all uppercase: {1}',
			regex: /[a-f]/,
			replacer: function(fullItem, result, rule) {
				var hexMatch = re.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, hexMatch.toUpperCase());
				}

				return fullItem;
			},
			test: function(item, regex) {
				var match = re.hasHex(item);

				return match && re.test(match, regex);
			}
		},

		hexRedundant: {
			message: function(lineNum, item, result, rule) {
				var match = re.hasHex(item);

				var message = 'Hex code can be reduced to ' + rule._reduceHex(match) + ': {1}';

				return re.message(message, lineNum, item, result, rule);
			},
			regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
			replacer: function(fullItem, result, rule) {
				var hexMatch = re.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, rule._reduceHex(hexMatch));
				}

				return fullItem;
			},
			test: function(item, regex) {
				var match = re.hasHex(item);

				return match && re.test(match, regex);
			},
			_reduceHex: function(hex) {
				return hex ? hex.replace(re.REGEX_HEX_REDUNDANT, re.REPLACE_REGEX_REDUNDANT) : '';
			}
		},

		missingInteger: {
			message: 'Missing integer: {1}',
			regex: /([^0-9])(\.\d+)/,
			replacer: '$10$2'
		},

		missingListValuesSpace: {
			message: 'Needs space between comma-separated values: {1}',
			regex: /,(?=[^\s])/g,
			replacer: ', '
		},

		missingNewlines: {
			message: function(lineNum, item, result, rule, context) {
				var message = 'There should be a newline between } and "{rule}"';

				message = re.message(message, lineNum, item, result, rule);

				return sub(
					message,
					{
						rule: context.nextItem.trim()
					}
				);
			},
			regex: /.*?(\}|\{)/,
			replacer: function(fullItem, result, rule, context) {
				if (result) {
					fullItem = fullItem.replace(
						rule.regex,
						function(m, bracket) {
							if (bracket == '{') {
								m = '\n' + m;
							}

							return m;
						}
					);
				}

				return fullItem;
			},
			test: function(item, regex, rule, context) {
				var hasCloser = re.REGEX_BRACE_CLOSING.test(item);
				var hasOpener = re.REGEX_BRACE_OPENING.test(item);

				var previousItem = context.previousItem || '';
				var nextItem = context.nextItem || '';

				var missingNewlines = false;

				if ((hasCloser && (nextItem.trim() !== '' && !re.REGEX_BRACE_CLOSING.test(nextItem))) ||
					(hasOpener && (previousItem.trim() !== '' && !re.REGEX_BRACE_OPENING.test(previousItem) && !re.REGEX_CSS_COMMA_END.test(previousItem)))) {
					missingNewlines = true;
				}

				return missingNewlines;
			}
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
			message: function(lineNum, item, result, rule, context) {
				return re.message('Trailing new line', lineNum - 1, item, result, rule);
			},
			test: function(item, regex, rule, context) {
				var hasCloser = re.REGEX_BRACE_CLOSING.test(item);
				var hasOpener = re.REGEX_BRACE_OPENING.test(item);

				var previousItem = context.previousItem;
				var nextItem = context.nextItem;

				var trailingNewlines = false;

				if (hasCloser && (previousItem === '')) {
					trailingNewlines = true;
				}

				return trailingNewlines;
			}
		},

		_properties: {
			invalidBorderReset: {
				message: function(lineNum, item, result, rule) {
					var borderReplacement = rule._getValidReplacement(result);

					var message = sub('You should use "{1}": {0}', item, borderReplacement.error);

					return re.message(message, lineNum, item, rule);
				},
				regex: /(border(-(?:right|left|top|bottom))?):\s?(none|0)(\s?(none|0))?;/,
				replacer: function(fullItem, result, rule) {
					return fullItem.replace(result[0], rule._getValidReplacement(result));
				},
				test: 'match',
				_getValidReplacement: function(result) {
					var borderProperty = result[1] || 'border';

					return '' + borderProperty + '-width: 0;';
				}
			},

			invalidFormat: {
				message: 'There should be one space after ":": {1}',
				regex: /^\t*([^:]+:(?:(?!\s)|(?=\s{2,})))[^;]+;$/,
				replacer: function(fullItem, result, rule) {
					return fullItem.replace(/:\s+/, ': ');
				},
				test: function(item, regex) {
					return item.indexOf(':') > -1 && regex.test(item);
				}
			}
		}
	},

	html: {

	},

	htmlJS: {
		liferayLanguage: {
			message: 'Do not use Liferay.Language.get() outside of .js files: {1}',
			regex: /Liferay\.Language\.get/
		},
		liferayProvide: {
			message: 'You can\'t have a Liferay.provide call in a script taglib that has a "use" attribute',
			regex: /Liferay\.provide/,
			test: function(item, regex, rule, context) {
				return context.asyncAUIScript && re.test(item, regex);
			}
		}
	},

	js: {
		IGNORE: /^(\t| )*(\*|\/\/)/,

		doubleQuotes: {
			message: 'Strings should be single quoted: {1}',
			regex: /"[^"]*"/,
			test: function(item, regex, rule) {
				var doubleQuoted = false;

				if (re.test(item, regex)) {
					// Remove the following from the line:
					// single quoted strings (e.g. var = '<img src="" />')
					// regular expressions (e.g. var = /"[^"]+"/)
					// comments (e.g. // some "comment" here or
					//  /* some "comment" here */)

					var newItem = item
						.replace(re.REGEX_SINGLE_QUOTES, '')
						.replace(re.REGEX_COMMENT, '')
						.replace(re.REGEX_REGEX, '');

					doubleQuoted = re.test(newItem, regex);
				}

				return doubleQuoted;
			}
		},

		elseFormat: {
			message: function(lineNum, item, result, rule) {
				var message = '"' + result[2] + '" should be on it\'s own line: {1}';

				return re.message(message, lineNum, item, rule);
			},
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

				return sub(re.message(message, lineNum, item, rule), rule._bracket);
			},
			regex: /\)\{(?!\})/,
			replacer: ') {',
			test: function(item, regex) {
				item = item.replace(re.REGEX_REGEX, '');

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
			message: function(lineNum, item, result, rule) {
				var message = '"' + result[1] + '" should have a space after it: {1}';

				return re.message(message, lineNum, item, rule);
			},
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
				var nextLineHasVar = re.test(context.nextItem, regex);

				var nextLineValid = (nextLineEmpty || nextLineHasVar);

				return re.test(item, /;$/) && re.test(item, regex) && !nextLineValid;
			},
		}
	}
};

A.mix(
	re,
	{
		hasExtraNewLines: function(item, index, collection, file) {
			var extraNewLines = false;

			if (item == '') {
				extraNewLines = (index === 0) || collection[index - 1] === '';
			}

			if (extraNewLines) {
				trackErr(re.message('Extra new line', index + 1).warn, file);
			}

			return extraNewLines;
		},

		hasHex: function(item) {
		var match = item.match(re.REGEX_HEX);

			return match && match[0];
		},

		hasProperty: function(item) {
			return re.REGEX_PROPERTY.test(item);
		},

		match: function(item, re) {
			return item.match(re);
		},

		message: function(message, lineNum, item, result, rule) {
			var instance = this;

			return sub('Line: {0} ', lineNum) + sub(message, lineNum, item);
		},

		test: function(item, regex) {
			return regex.test(item);
		}
	}
);

module.exports = re;