var base = require('./base');

var A = base.A;

var sub = base.sub;

var MAP_WHITESPACE = {
	'\xa0': ' ',
	'\x95': '',
	'\x99': ''
};

var REGEX_WHITESPACE_CHARS = new RegExp('(' + Object.keys(MAP_WHITESPACE).join('|') + ')', 'g');

var RULES = {
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

	REGEX_LANG_EMPTYFN: /(^|(A\.)?(Lang\.)?)emptyFn(True|False)?/,

	REGEX_LEADING_INCLUDE: /^@include /,
	REGEX_LEADING_SPACE: /^\s+/,

	REGEX_PROP_KEY: /^\s*(?:@include\s)?([^:]+)(?:)/,
	REGEX_PROPERTY: /^\t*([^:]+:|@include\s)[^;]+;$/,

	REGEX_SCRIPTLET_STUB: new RegExp('^\\s*' + base.jspLintStubs.scriptlet + '$'),

	REGEX_REGEX: /\/.*\/([gim]{1,3})?/g,
	REGEX_SERVICE_PROPS: /(^@)|((.*?) = (.*?))/,
	REGEX_SINGLE_QUOTES: /'[^']*'/g,

	REGEX_STUBS: new RegExp('^_*(' + Object.keys(base.stubs).join('|') + ')_*'),

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
		},
		invalidWhiteSpace: {
			message: function(lineNum, item, result, rule) {
				var displayedItem = item.replace(
					new RegExp(rule.regex.source, 'g'),
					'$1'.bgError
				);

				return this.message('Invalid whitespace characters: {1}', lineNum, displayedItem, result, rule);
			},
			regex: REGEX_WHITESPACE_CHARS,
			replacer: function(fullItem, result, rule) {
				return fullItem.replace(
					rule.regex,
					function(str, m) {
						return MAP_WHITESPACE[m];
					}
				);
			},
			testFullItem: true
		}
	},

	css: {
		hexLowerCase: {
			message: 'Hex code should be all uppercase: {1}',
			regex: /[a-f]/,
			replacer: function(fullItem, result, rule) {
				var hexMatch = this.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, hexMatch.toUpperCase());
				}

				return fullItem;
			},
			test: function(item, regex) {
				var match = this.hasHex(item);

				return match && this.test(match, regex);
			}
		},

		hexRedundant: {
			message: function(lineNum, item, result, rule) {
				var match = this.hasHex(item);

				var message = 'Hex code can be reduced to ' + rule._reduceHex(match) + ': {1}';

				return this.message(message, lineNum, item, result, rule);
			},
			regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
			replacer: function(fullItem, result, rule) {
				var hexMatch = this.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, rule._reduceHex(hexMatch));
				}

				return fullItem;
			},
			test: function(item, regex) {
				var match = this.hasHex(item);

				return match && this.test(match, regex);
			},
			_reduceHex: function(hex) {
				return hex ? hex.replace(this.REGEX_HEX_REDUNDANT, this.REPLACE_REGEX_REDUNDANT) : '';
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
			replacer: ', '
		},

		missingNewlines: {
			message: function(lineNum, item, result, rule, context) {
				var message = 'There should be a newline between } and "{rule}"';

				message = this.message(message, lineNum, item, result, rule);

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
				var hasCloser = this.REGEX_BRACE_CLOSING.test(item);
				var hasOpener = this.REGEX_BRACE_OPENING.test(item);

				var previousItem = context.previousItem || '';
				var nextItem = context.nextItem || '';

				var missingNewlines = false;

				if ((hasCloser && (nextItem.trim() !== '' && !this.REGEX_BRACE_CLOSING.test(nextItem))) ||
					(hasOpener && (previousItem.trim() !== '' && !this.REGEX_BRACE_OPENING.test(previousItem) && !this.REGEX_CSS_COMMA_END.test(previousItem)))) {
					missingNewlines = true;
				}

				return missingNewlines;
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
			message: function(lineNum, item, result, rule, context) {
				var offset = 0;

				if (result == rule.PRECEDING) {
					offset = -1;
				}
				else if (result === rule.TRAILING) {
					offset = 1;
				}

				return this.message('Needless new line', lineNum + offset, item, result, rule);
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
					trailingNewlines = rule.TRAILING;
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
				message: function(lineNum, item, result, rule) {
					var borderReplacement = rule._getValidReplacement(result);

					var message = sub('You should use "{1}": {0}', item, borderReplacement.error);

					return this.message(message, lineNum, item, rule);
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
				return context.asyncAUIScript && this.test(item, regex);
			}
		}
	},

	js: {
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
	}
};

var re = function(rules) {
	A.mix(this, rules);
};

re.prototype.getValue = function(object, path) {
	if (A.Lang.isString(path)) {
		path = path.split('.');
	}

	return A.Object.getValue(object, path);
};

re.prototype.getWarning = function(lineNum, item, result, rule, context) {
	var warning;

	var message = rule.message || this.message;

	if (rule.message === false) {
		message = false;
	}

	if (A.Lang.isString(message)) {
		warning = this.message(message, lineNum, item, result, rule, context);
	}
	else if (A.Lang.isFunction(message)) {
		warning = message.call(this, lineNum, item, result, rule, context);
	}

	return warning;
};

re.prototype.hasExtraNewLines = function(item, index, collection, logger) {
	var extraNewLines = false;

	if (item == '') {
		extraNewLines = (index === 0) || collection[index - 1] === '';
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

re.prototype.isValidRuleSet = function(rules, fullItem, context) {
	var ignore = rules.IGNORE;
	var customIgnore = context.customIgnore;

	return (!ignore || (ignore && !ignore.test(fullItem))) &&
			(!customIgnore || (customIgnore && !customIgnore.test(fullItem)));
};

re.prototype.iterateRules = function(rules, fullItem, context) {
	var instance = this;

	if (A.Lang.isString(rules)) {
		rules = instance.getValue(instance, rules);
	}

	var item = context.item;
	var lineNum = context.lineNum;
	var hasSheBang = context.hasSheBang;
	var logger = context.logger;

	if (A.Lang.isObject(rules)) {
		var ignore = rules.IGNORE;

		if (instance.isValidRuleSet(rules, fullItem, context)) {
			A.Object.each(
				rules,
				function(rule, ruleName) {
					if ((ruleName === 'IGNORE' || ruleName.indexOf('_') === 0) || (rule.ignore == 'node' && hasSheBang)) {
						return;
					}

					var result = instance.testLine(rule, fullItem, context);

					if (result) {
						var warning = instance.getWarning(lineNum, item, result, rule, context);

						if (warning && logger) {
							logger(lineNum, warning);
						}

						fullItem = instance.replaceItem(lineNum, fullItem, result, rule, context);
					}
				}
			);
		}
	}

	return fullItem;
};

re.prototype.match = function(item, re) {
	return item.match(re);
};

re.prototype.message = function(message, lineNum, item, result, rule) {
	return sub(message, lineNum, item);
};

re.prototype.replaceItem = function(lineNum, fullItem, result, rule, context) {
	var replacer = rule.replacer;

	if (replacer) {
		if (A.Lang.isString(replacer)) {
			fullItem = fullItem.replace(rule.regex, replacer);
		}
		else if (A.Lang.isFunction(replacer)) {
			fullItem = replacer.call(this, fullItem, result, rule, context);
		}

		var formatItem = context.formatItem;

		if (formatItem) {
			fullItem = formatItem.call(this, fullItem, context);
		}
	}

	return fullItem;
};

re.prototype.test = function(item, regex) {
	return regex.test(item);
};

re.prototype.testLine = function(rule, fullItem, context) {
	var regex = rule.regex;
	var test = rule.test || this.test;

	if (test === 'match') {
		test = this.match;
	}

	var testItem = context.item;

	if (rule.testFullItem) {
		testItem = fullItem;
	}

	return test.call(this, testItem, regex, rule, context);
};

var rulesInstance = new re(RULES);

rulesInstance.re = re;

module.exports = rulesInstance;