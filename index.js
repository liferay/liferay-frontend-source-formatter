#!/usr/bin/env node

var async = require('async');
var cli = require('cli');
var colors = require('colors');
var fs = require('fs');
var path = require('path');
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

var REGEX_EXT_CSS = /\.(s)?css$/;
var REGEX_EXT_HTML = /\.(jsp.?|html|vm|ftl)$/;
var REGEX_EXT_JS = /\.js$/;

var REGEX_LEADING_SPACE = /^\s+/;
var REGEX_LEADING_INCLUDE = /^@include /;
var REGEX_PROP_KEY = /^\s*(?:@include\s)?([^:]+)(?:)/;

var REGEX_PROPERTY = /^\t*([^:]+:|@include\s)[^;]+;$/;
var REGEX_SUB = /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g;
// var REGEX_ZERO_UNIT = /\b0(?!s\b)[a-zA-Z]{1,}\b/;
var REGEX_INTEGER_DECIMAL = /([^0-9])(\.\d+)/;
var REGEX_DOUBLE_QUOTES = /"[^"]*"/;
var REGEX_SINGLE_QUOTES = /'[^']*'/g;
var REGEX_REGEX = /\/[^\/]+\//g;
var REGEX_COMMENT = /\/(\/|\*).*/g;
var REGEX_ZERO_UNIT = /(#?)(\b0(?!s\b)[a-zA-Z]{1,}\b)/;
var REGEX_HEX_REDUNDANT = /#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3/;
var REGEX_HEX_LOWER = /[a-f]/;
var REGEX_HEX = /#[0-9A-Fa-f]{3,6}/;

var REGEX_MIXED_SPACES = /^.*( \t|\t ).*$/;

var REPLACE_REGEX_REDUNDANT = '#$1$2$3';

var hasProperty = function(item) {
	return REGEX_PROPERTY.test(item);
};

var hasLowerCaseRegex = function(item) {
	var match = item.match(REGEX_HEX);
	var lowerCaseRegex = false;

	if (match) {
		lowerCaseRegex = REGEX_HEX_LOWER.test(match);
	}

	return lowerCaseRegex;
};

var hasRedundantRegex = function(item) {
	return REGEX_HEX_REDUNDANT.test(item);
};

var hasMissingInteger = function(item) {
	return REGEX_INTEGER_DECIMAL.test(item);
};

var hasNeedlessUnit = function(item) {
	var m = item.match(REGEX_ZERO_UNIT);

	return m && !m[1];
	// return REGEX_ZERO_UNIT.test(item);
};

var hasMixedSpaces = function(item) {
	return REGEX_MIXED_SPACES.test(item);
};

var _testDoubleQuotes = function(item) {
	return REGEX_DOUBLE_QUOTES.test(item);
};

var hasDoubleQuotes = function(item) {
	var doubleQuoted = false;

	if (_testDoubleQuotes(item)) {
		// Remove the following from the line:
		// single quoted strings (e.g. var = '<img src="" />')
		// regular expressions (e.g. var = /"[^"]+"/)
		// comments (e.g. // some "comment" here or
		//  /* some "comment" here */)

		var newItem = item
			.replace(REGEX_SINGLE_QUOTES, '')
			.replace(REGEX_COMMENT, '')
			.replace(REGEX_REGEX, '');

		doubleQuoted = _testDoubleQuotes(newItem);
	}

	return doubleQuoted;
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

var sub = function(str, obj) {
	var objType = typeof obj;

	if (objType !== 'object' && objType !== 'function') {
		obj = Array.prototype.slice.call(arguments, 1);
	}

	return str.replace ? str.replace(REGEX_SUB, function(match, key) {
		return (typeof obj[key] !== 'undefined') ? obj[key] : match;
	}) : s;
};

var iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

var checkCss = function(contents, file) {
	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;
			var nextItem = collection[lineNum] && collection[lineNum].trim();

			if (hasProperty(item)) {
				item = item.replace(REGEX_LEADING_SPACE, '').replace(REGEX_LEADING_INCLUDE, '');

				var nextItemMatch;

				var itemMatch = item.match(REGEX_PROP_KEY);

				if (nextItem && hasProperty(nextItem)) {
					nextItem = nextItem.replace(REGEX_LEADING_SPACE, '');
					nextItemMatch = nextItem && hasProperty(nextItem) && nextItem.match(REGEX_PROP_KEY);
				}

				if (itemMatch && nextItemMatch) {
					if (itemMatch[1] > nextItemMatch[1]) {
						trackErr(sub('Line: {0} Sort: {1} {2}', lineNum, item, nextItem).warn, file);
					}
				}
			}

			var hexMatch = item.match(REGEX_HEX);

			if (hexMatch) {
				hexMatch = hexMatch[0];

				if (hasLowerCaseRegex(hexMatch)) {
					trackErr(sub('Line {0} Hex code should be all uppercase: {1}', lineNum, item).warn, file);

					var newHex = hexMatch.toUpperCase();

					fullItem = fullItem.replace(hexMatch, newHex);

					hexMatch = newHex;

					item = fullItem.trim();
				}

				if (hasRedundantRegex(hexMatch)) {
					var reducedHex = hexMatch.replace(REGEX_HEX_REDUNDANT, REPLACE_REGEX_REDUNDANT);

					trackErr(sub('Line {0} Hex code can be reduced to {2}: {1}', lineNum, item, reducedHex).warn, file);

					fullItem = fullItem.replace(hexMatch, reducedHex);

					hexMatch = reducedHex;

					item = fullItem.trim();
				}
			}

			if (hasNeedlessUnit(item)) {
				trackErr(sub('Line {0} Needless unit: {1}', lineNum, item).warn, file);

				fullItem = fullItem.replace(REGEX_ZERO_UNIT, '0');

				item = fullItem.trim();
			}

			if (hasMissingInteger(item)) {
				trackErr(sub('Line {0} Missing integer: {1}', lineNum, item).warn, file);

				fullItem = fullItem.replace(REGEX_INTEGER_DECIMAL, '$10$2');

				item = fullItem.trim();
			}

			if (hasMixedSpaces(fullItem)) {
				trackErr(sub('Line {0} Mixed spaces and tabs: {1}', lineNum, item).warn, file);

				console.log(fullItem.replace(/\s/g, '-'));
				fullItem = fullItem.replace(/(.*)( +\t|\t +)(.*)/g, function(str, prefix, problem, suffix) {
					// console.log(problem.split('\t').join('').length);
					problem = problem.replace(/ {4}| {2}/g, '\t').replace(/ /g, '');
					return prefix + problem + suffix;
				});
				console.log(fullItem.replace(/\s/g, '+'));
			}

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

			if (hasMixedSpaces(fullItem)) {
				trackErr(sub('Line {0} Mixed spaces and tabs: {1}', lineNum, item).warn, file);
			}

			if (hasDoubleQuotes(fullItem)) {
				trackErr(sub('Line {0} Strings should be single quoted: {1}', lineNum, item).warn, file);
			}

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

			var attrs = fullItem.match(/(?: )([A-Za-z0-9-]+=["'][^"']+["'])/g);

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

						var pieces = item.trim().match(/^([^=]+)=["'](.*)["']$/);

						var attrName = pieces[1];
						var attrValue = pieces[2];

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
					return cb(err);
				}

				if (REGEX_EXT_CSS.test(file)) {
					formatter = checkCss;
				}
				else if (REGEX_EXT_JS.test(file)) {
					formatter = checkJs;
				}
				else if (REGEX_EXT_HTML.test(file)) {
					formatter = checkHTML;
				}

				var content = formatter(data, file);
// console.log(content == data, file);
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
							return cb(err);
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