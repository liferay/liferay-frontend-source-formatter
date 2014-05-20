#!/usr/bin/env node

var async = require('async');
var cli = require('cli');
var colors = require('colors');
var fs = require('fs');
var path = require('path');
var updateNotifier = require('update-notifier');
var YUI = require('yui').YUI;
var A = YUI().use('yui-base', 'oop', 'array-extras');

var argv = require('optimist').usage('Usage: $0 -qo')
			.options(
				{
					i: {
						alias: 'inline-edit',
						boolean: true,
						default: false
					},
					o: {
						alias: 'open',
						boolean: true,
						default: false
					},
					q: {
						alias: 'quiet',
						boolean: true,
						default: false
					},
					r: {
						alias: 'relative',
						boolean: true,
						default: false
					},
					v: {
						alias: 'verbose',
						boolean: true,
						default: false
					}
				}
			).argv;

var notifier = updateNotifier();

if (notifier.update) {
	notifier.notify(true);
}

colors.setTheme({
	help: 'cyan',
	warn: 'yellow',
	error: 'red',
	subtle: 'grey'
});

var args = argv._;

var INDENT = '    ';

var QUIET = argv.q;
var VERBOSE = argv.v;
var RELATIVE = argv.r;
var INLINE_REPLACE = argv.i;

var CWD = process.env.GIT_PWD || process.cwd();
var TOP_LEVEL;

var re = {
	REGEX_EXT_CSS: /\.(s)?css$/,
	REGEX_EXT_HTML: /\.(jsp.?|html|vm|ftl)$/,
	REGEX_EXT_JS: /\.js$/,

	REGEX_LEADING_SPACE: /^\s+/,
	REGEX_LEADING_INCLUDE: /^@include /,
	REGEX_PROP_KEY: /^\s*(?:@include\s)?([^:]+)(?:)/,

	REGEX_PROPERTY: /^\t*([^:]+:|@include\s)[^;]+;$/,
	REGEX_SUB: /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g,

	REGEX_SINGLE_QUOTES: /'[^']*'/g,
	REGEX_REGEX: /\/[^\/]+\//g,
	REGEX_COMMENT: /\/(\/|\*).*/g,

	REGEX_HEX_REDUNDANT: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
	REGEX_HEX: /#[0-9A-Fa-f]{3,6}\b/,

	REPLACE_REGEX_REDUNDANT: '#$1$2$3',

	common: {
		mixedSpaces: {
			regex: /^.*( \t|\t ).*$/,
			replacer: function(fullItem, result, rule) {
				// console.log(fullItem.replace(/\s/g, '-'));
				fullItem = fullItem.replace(/(.*)( +\t|\t +)(.*)/g, function(str, prefix, problem, suffix) {
					// console.log(problem.split('\t').join('').length);
					problem = problem.replace(/ {4}| {2}/g, '\t').replace(/ /g, '');

					return prefix + problem + suffix;
				});

				return fullItem;
			},
			testFullItem: true,
			message: 'Mixed spaces and tabs: {1}',
		}
	},

	css: {
		hexRedundant: {
			regex: /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/,
			test: function(item, regex) {
				var match = re.hasHex(item);

				return match && re.test(match, regex);
			},
			message: function(lineNum, item, result, rule) {
				var match = re.hasHex(item);

				var message = 'Hex code can be reduced to ' + rule._reduceHex(match) + ': {1}';

				return re.message(message, lineNum, item, result, rule);
			},
			replacer: function(fullItem, result, rule) {
				var hexMatch = re.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, rule._reduceHex(hexMatch));
				}

				return fullItem;
			},
			_reduceHex: function(hex) {
				return hex ? hex.replace(re.REGEX_HEX_REDUNDANT, re.REPLACE_REGEX_REDUNDANT) : '';
			},
		},
		hexLowerCase: {
			regex: /[a-f]/,
			test: function(item, regex) {
				var match = re.hasHex(item);

				return match && re.test(match, regex);
			},
			replacer: function(fullItem, result, rule) {
				var hexMatch = re.hasHex(fullItem);

				if (hexMatch) {
					fullItem = fullItem.replace(hexMatch, hexMatch.toUpperCase());
				}

				return fullItem;
			},
			message: 'Hex code should be all uppercase: {1}',
		},

		missingNewlines: {
			test: function(item, regex, rule, context) {
				var hasCloser = item.indexOf('}') > -1;
				var hasOpener = item.indexOf('{') > -1;

				var previousItem = context.previousItem || '';
				var nextItem = context.nextItem || '';

				var missingNewlines = false;

				if ((hasCloser && (nextItem.trim() != '' && nextItem.indexOf('}') === -1)) ||
					(hasOpener && (previousItem.trim() != '' && previousItem.indexOf('{') === -1))) {
					missingNewlines = true;
				}

				return missingNewlines;
			},
			message: function(lineNum, item, result, rule, context) {
				var message = 'There should be a newline between } and "{rule}"';

				message = re.message(message, lineNum, item, result, rule);

				return sub(message, {rule: context.nextItem.trim()});
			},
			regex: /.*?(\}|\{)/,
			replacer: function(fullItem, result, rule, context) {
				if (result) {
					fullItem = fullItem.replace(rule.regex, function(m, bracket) {
						if (bracket == '{') {
							m = '\n' + m;
						}

						return m;
					});
				}

				return fullItem;
			}
		},
		trailingNewlines: {
			test: function(item, regex, rule, context) {
				var hasCloser = item.indexOf('}') > -1;
				var hasOpener = item.indexOf('{') > -1;

				var previousItem = context.previousItem;
				var nextItem = context.nextItem;

				var trailingNewlines = false;

				if (hasCloser && (previousItem === '')) {
					trailingNewlines = true;
				}

				return trailingNewlines;
			},
			message: function(lineNum, item, result, rule, context) {
				return re.message('Trailing new line', lineNum - 1, item, result, rule);
			}
		},

		needlessUnit: {
			regex: /(#?)(\b0(?!s\b)[a-zA-Z]{1,}\b)/,
			test: function(item, regex) {
				var m = item.match(regex);

				return m && !m[1];
			},
			message: 'Needless unit: {1}',
			replacer: '0'
		},
		missingInteger: {
			regex: /([^0-9])(\.\d+)/,
			message: 'Missing integer: {1}',
			replacer: '$10$2',
		},
		missingListValuesSpace: {
			regex: /,(?=[^\s])/g,
			replacer: ', ',
			message: 'Needs space between comma-separated values: {1}'
		},
		_properties: {
			invalidBorderReset: {
				regex: /(border(-(?:right|left|top|bottom))?):\s?(none|0)(\s?(none|0))?;/,
				test: 'match',
				message: function(lineNum, item, result, rule) {
					var borderReplacement = rule._getValidReplacement(result);

					var message = sub('You should use "{1}": {0}', item, borderReplacement.error);

					return re.message(message, lineNum, item, rule);
				},
				replacer: function(fullItem, result, rule) {
					return fullItem.replace(result[0], rule._getValidReplacement(result));
				},
				_getValidReplacement: function(result) {
					var borderProperty = result[1] || 'border';

					return '' + borderProperty + '-width: 0;';
				},
			},

			invalidFormat: {
				regex: /^\t*([^:]+:(?:(?!\s)|(?=\s{2,})))[^;]+;$/,
				test: function(item, regex) {
					return item.indexOf(':') > -1 && regex.test(item);
				},
				message: 'There should be one space after ":": {1}',
				replacer: function(fullItem, result, rule) {
					return fullItem.replace(/:\s+/, ': ');
				}
			}
		}
	},

	html: {

	},

	js: {
		IGNORE: /^(\t| )*(\*|\/\/)/,
		logging: {
			regex: /\bconsole\.[^\(]+?\(/,
			// replacer: ,
			message: 'Debugging statement: {1}',
		},
		invalidConditional: {
			regex: /\)\{(?!\})/,
			replacer: ') {',
			message: function(lineNum, item, result, rule) {
				var message = 'Needs a space between ")" and "{bracket}": {1}';

				return sub(re.message(message, lineNum, item, rule), rule._bracket);
			},
			_bracket: {
				bracket: '{'
			}
		},
		invalidArgumentFormat: {
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
			},
			// replacer: ,
			message: 'These arguments should each be on their own line: {1}',
		},
		invalidFunctionFormat: {
			regex: /function\s+\(/,
			replacer: 'function(',
			message: 'Anonymous function expressions should be formatted as function(: {1}',
		},
		doubleQuotes: {
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
			},
			// replacer: ,
			message: 'Strings should be single quoted: {1}'
		},

		elseFormat: {
			regex: /^(\s+)?\} ?(else|catch|finally)/,
			test: 'match',
			replacer: '$1}\n$1$2',
			message: function(lineNum, item, result, rule) {
				var message = '"' + result[2] + '" should be on it\'s own line: {1}';

				return re.message(message, lineNum, item, rule);
			},
			testFullItem: true
		},

		keywordFormat: {
			regex: /\b(try|catch|if|for|else|switch|while)(\(|\{)/,
			test: 'match',
			replacer: '$1 $2',
			message: function(lineNum, item, result, rule) {
				var message = '"' + result[1] + '" should have a space after it: {1}';

				return re.message(message, lineNum, item, rule);
			},
		},
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
	},
};

var fileErrors = {};

var trackErr = function(err, file) {
	var errors = fileErrors[file];

	if (!errors) {
		errors = [];

		fileErrors[file] = errors;
	}

	errors.push(err);
}

var formatPropertyItem = function(item) {
	return item.replace(re.REGEX_LEADING_SPACE, '').replace(re.REGEX_LEADING_INCLUDE, '');
};

var sub = function(str, obj) {
	var objType = typeof obj;

	if (objType !== 'object' && objType !== 'function') {
		obj = Array.prototype.slice.call(arguments, 1);
	}

	return str.replace ? str.replace(re.REGEX_SUB, function(match, key) {
		return (typeof obj[key] !== 'undefined') ? obj[key] : match;
	}) : s;
};

var iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

var getValue = function(object, path) {
	if (A.Lang.isString(path)) {
		path = path.split('.');
	}

	return A.Object.getValue(object, path);
};

var iterateRules = function(rules, fullItem, context) {
	var instance = this;

	if (A.Lang.isString(rules)) {
		rules = getValue(re, rules);
	}

	var item = context.item;
	var lineNum = context.lineNum;
	var file = context.file;
	var formatItem = context.formatItem;
	var customIgnore = context.customIgnore;

	if (A.Lang.isObject(rules)) {
		var ignore = rules.IGNORE;

		if ((!ignore || (ignore && !ignore.test(fullItem))) &&
			(!customIgnore || (customIgnore && !customIgnore.test(fullItem)))) {

			A.Object.each(
				rules,
				function(rule, ruleName) {
					if (ruleName === 'IGNORE' || ruleName.indexOf('_') === 0) {
						return;
					}

					var regex = rule.regex;
					var test = rule.test || re.test;

					if (test === 'match') {
						test = re.match;
					}

					var testItem = item;

					if (rule.testFullItem) {
						testItem = fullItem;
					}

					var result = test(testItem, regex, rule, context);

					var message = rule.message || re.message;

					if (result) {
						var warning;

						if (A.Lang.isString(message)) {
							warning = re.message(message, lineNum, item, result, rule, context);
						}
						else if (A.Lang.isFunction(message)) {
							warning = message(lineNum, item, result, rule, context);
						}

						trackErr(warning.warn, file);

						var replacer = rule.replacer;

						if (replacer) {
							if (A.Lang.isString(replacer)) {
								fullItem = fullItem.replace(regex, replacer);
							}
							else if (A.Lang.isFunction(replacer)) {
								fullItem = replacer(fullItem, result, rule, context);
							}

							if (formatItem) {
								item = formatItem(fullItem, context);
							}
							else if (formatItem !== false) {
								item = fullItem.trim();
							}
						}
					}
				}
			);
		}
	}

	return fullItem;
};

var postFormatPropertyItem = function(fullItem) {
	return formatPropertyItem(fullItem.trim());
};

var checkCss = function(contents, file) {
	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;
			var nextItem = collection[lineNum] && collection[lineNum].trim();
			var previousItem = null;

			if (index > 0) {
				previousItem = collection[index - 1];
				previousItem = previousItem && previousItem.trim();
			}

			var rules = re.css;

			var propertyRules = rules._properties;

			var context = {
				item: item,
				lineNum: lineNum,
				file: file,
				previousItem: previousItem,
				nextItem: nextItem
			};

			fullItem = iterateRules('common', fullItem, context);

			item = context.item = fullItem.trim();

			if (re.hasProperty(item)) {
				item = formatPropertyItem(item);

				var propertyContext = A.merge(
					context,
					{
						item: item,
						formatItem: postFormatPropertyItem
					}
				);

				fullItem = iterateRules('css._properties', fullItem, propertyContext);

				var nextItemMatch;

				var itemMatch = item.match(re.REGEX_PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(re.REGEX_LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(re.REGEX_PROP_KEY);
				}

				if (itemMatch && nextItemMatch) {
					if (itemMatch[1] > nextItemMatch[1]) {
						trackErr(sub('Line: {0} Sort: {1} {2}', lineNum, item, nextItem).warn, file);
					}
				}
			}

			context.item = item;

			fullItem = iterateRules('css', fullItem, context);

			item = fullItem.trim();

			return fullItem;
		}
	);
};

var checkJs = function(contents, file) {
	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;

			var context = {
				item: item,
				lineNum: lineNum,
				file: file,
				customIgnore: re.js.IGNORE
			};

			fullItem = iterateRules('common', fullItem, context);

			item = context.item = fullItem.trim();

			fullItem = iterateRules('js', fullItem, context);

			item = context.item = fullItem.trim();

			return fullItem;
		}
	);
};

var checkHTML = function(contents, file) {
	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;

			var attrs = fullItem.match(/(?: )([A-Za-z0-9-]+=(["']).+?\2)/g);

			if (attrs) {
				var lastAttr = -1;

				attrs.forEach(
					function(item, index, collection) {
						var oldItem = item;
						// item = item.trim();
						// console.log(item.match(/^([^=]+)=["'](.*)["']$/));
						// var pieces = item.trim().split('=');

						// var attrName = pieces[0];
						// var attrValue = pieces[1].trim().replace(/(^["']|["']$)/g, '');

						var pieces = item.trim().match(/^([^=]+)=(["'])(.*)\2$/);

						var attrName = pieces[1];
						var attrValue = pieces[3];

						if (lastAttr > attrName) {
							var re = new RegExp('\\b' + lastAttr + '\\b.*?> ?<.*?' + attrName);

							var note = '';

							if (re.test(fullItem)) {
								note = '**'
							}

							if (!note || note && VERBOSE) {
								trackErr(sub('Line {0} Sort attributes{3}: {1} {2}', lineNum, lastAttr, attrName, note).warn, file);
							}
						}

						var styleAttr = (attrName == 'style');
						var onAttr = (attrName.indexOf('on') === 0);
						var labelAttr = (attrName.indexOf('label') === 0);

						var id = 0;
						var token = String.fromCharCode(-1);

						var m = attrValue.match(/<%.*?%>/g);

						var matches = m && m.map(
							function(item, index, collection) {
								attrValue = attrValue.replace(item, token + index + token);

								return item;
							}
						);

						// while (m = attrValue.match(/<%.*?%>/g)) {
						//	console.log(m[0]);
						//	id++;
						// }

						var attrSep = ' ';

						if (styleAttr) {
							attrSep = /\s?;\s?/;
						}

						var attrValuePieces = attrValue.split(attrSep);

						var lastAttrPiece = -1;

						var sort = false;

						attrValuePieces.forEach(
							function(item, index, collection) {
								item = item.trim();
								if (/^[A-Za-z]/.test(item)) {
									// Skip event handlers like onClick, etc since they will have
									// complex values that probably shouldn't be sorted
									if (!onAttr && !labelAttr && lastAttrPiece > item) {
										trackErr(sub('Line {0} Sort attribute values: {1} {2}', lineNum, lastAttrPiece, item).warn, file);

										sort = true;
									}

									lastAttrPiece = item;
								}
							}
						);

						lastAttr = attrName;

						var newAttrValue;

						if (sort) {
							attrValuePieces = attrValuePieces.filter(
								function(item, index, collection) {
									return !!item.trim();
								}
							);

							attrValuePieces.sort();

							if (styleAttr) {
								newAttrValue = attrValuePieces.join('; ') + ';';
							}
							else {
								newAttrValue = attrValuePieces.join(' ');
							}

							item = item.replace(attrValue, newAttrValue);
						}

						if (matches) {
							newAttrValue = attrValue.replace(new RegExp(token + '(\\d+)' + token, 'g'), function(str, id){
								return matches[id];
							});

							item = item.replace(attrValue, newAttrValue)
							// console.log(fullItem);
						}

						fullItem = fullItem.replace(oldItem, item);
					}
				);
			}

			return fullItem;
		}
	);
};

var series = args.map(
	function(file) {
		return function(cb) {
			fs.readFile(file, 'utf-8', function (err, data) {
				if (err) {
					return cb(null, '');
				}

				if (re.REGEX_EXT_CSS.test(file)) {
					formatter = checkCss;
				}
				else if (re.REGEX_EXT_JS.test(file)) {
					formatter = checkJs;
				}
				else if (re.REGEX_EXT_HTML.test(file)) {
					formatter = checkHTML;
				}

				var content = formatter(data, file);

				var errors = fileErrors[file] || [];

				var includeHeaderFooter = (errors.length || !QUIET);

				if (includeHeaderFooter) {
					var fileName = file;

					if (RELATIVE) {
						file = path.relative(CWD, file);
					}

					console.log('File:'.blackBG + ' ' + file.underline);
				}

				if (errors.length) {
					console.log(INDENT + errors.join('\n' + INDENT));
				}
				else if (includeHeaderFooter) {
					console.log(INDENT + 'clear');
				}

				if (includeHeaderFooter) {
					console.log('----'.subtle);
				}

				var changed = (content != data);

				if (INLINE_REPLACE && changed) {
					fs.writeFile(file, content, function(err, result) {
						if (err) {
							return cb(null, '');
						}

						cb(null, content);
					});
				}
				else {
					cb(null, content);
				}
			});
		}
	}
);

var callback = function() {};

if (argv.o) {
	callback = function(err, result) {
		var errorFiles = Object.keys(fileErrors);

		if (errorFiles.length) {
			cli.exec(
				'git config --get user.editor',
				function(res) {
					cli.exec(
						'open -a "' + res[0] + '" "' + errorFiles.join('" "') + '"'
					);
				}
			);
		}
	};
}

if (RELATIVE) {
	series.unshift(
		function(cb) {
			cli.exec(
				'git rev-parse --show-toplevel',
				function(res) {
					TOP_LEVEL = res;
					cb();
				}
			);
		}
	);
}

async.series(series, callback);