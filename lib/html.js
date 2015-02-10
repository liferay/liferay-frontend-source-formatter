var argv = require('./argv');
var base = require('./base');
var re = require('./re');

var Formatter = require('./formatter_base');

var iterateLines = base.iterateLines;
var sub = base.sub;

var jspLintStubs = base.jspLintStubs;

var iterateRules = re.iterateRules;

var VERBOSE = argv.v;

var scriptletBlockOpen = '/* scriptlet block ';
var scriptletBlockClose = ' */';

var token = String.fromCharCode(-1);
var nsToken = String.fromCharCode(-2);


var getScriptletBlockReplacement = function(length) {
	return scriptletBlockOpen + (new Array(length).join('\nvoid 0;')) + scriptletBlockClose;
};

require('./js');

Formatter.HTML = Formatter.create(
	{
		extensions: '*.+(jsp*|htm*|vm|ftl|tpl|tmpl)',
		id: 'html',
		prototype: {
			extractJs: function(contents) {
				var filePath = this.file.path;

				var scriptBlocks = [];

				var hasJs = (re.REGEX_AUI_SCRIPT).test(contents);

				if (hasJs) {
					var reAUIScriptGlobal = new RegExp(re.REGEX_AUI_SCRIPT.source, 'g');

					var newContents = contents.replace(/<%.*?%>/gim, jspLintStubs.scriptlet)
										.replace(/<%=[^>]+>/g, jspLintStubs.echoScriptlet)
										.replace(/<portlet:namespace \/>/g, jspLintStubs.namespace);

					newContents.replace(
						reAUIScriptGlobal,
						function(m, tagNamespace, scriptAttrs, body, index) {
							if (!body) {
								return;
							}

							var lines = newContents.substring(0, index).split('\n').length;

							scriptBlocks.push(
								{
									contents: body,
									file: filePath,
									match: m,
									scriptAttrs: scriptAttrs,
									startLine: lines,
									tagNamespace: tagNamespace
								}
							);
						}
					);
				}

				return scriptBlocks;
			},

			format: function(contents) {
				var instance = this;

				instance._attrMap = {};

				instance.parseJs(contents);

				var filePath = instance.file.path;

				var logger = instance.log.bind(instance);

				return iterateLines(
					contents,
					function(item, index, collection) {
						var fullItem = item;

						item = item.trim();

						re.hasExtraNewLines(item, index, collection, logger);

						var lineNum = index + 1;

						var filteredItem = fullItem;


						filteredItem = instance._attrRemoveScriptlets(filteredItem, lineNum);
						filteredItem = instance._attrRemoveTags(filteredItem, lineNum);

						filteredItem = instance._processAttrs(filteredItem, lineNum);

						fullItem = filteredItem;

						fullItem = instance._attrRestoreScriptlets(fullItem, lineNum);
						fullItem = instance._attrRestoreTags(fullItem, lineNum);

						var context = {
							file: filePath,
							item: item,
							logger: logger,
							lineNum: lineNum
						};

						fullItem = iterateRules('html', fullItem, context);

						return fullItem;
					}
				);
			},

			formatJS: function(scriptBlocks) {
				var jsFormatter = new Formatter.JS(this.file.path);
				var esLintConfig = require('./eslint_config_jsp');

				return scriptBlocks.map(
					function(item, index) {
						jsFormatter.format(item.contents, esLintConfig);
					}
				);
			},

			parseJs: function(contents) {
				var scriptBlocks = this.extractJs(contents);

				scriptBlocks = this.sanitizeScriptBlocks(scriptBlocks);
				scriptBlocks = this.formatJS(scriptBlocks);
			},

			sanitizeScriptBlocks: function(scriptBlocks) {
				var instance = this;

				scriptBlocks = scriptBlocks.map(
					function(item, index) {
						var contents = item.contents;

						item = instance._jsIterateRules(item);
						item = instance._jsRemoveScriptletBlocks(item);
						item = instance._jsPadLines(item);
						item = instance._jsHandleScriptletWhitespace(item);

						return item;
					}
				);

				return scriptBlocks;
			},

			_attrCheckOrder: function(attrName, lastAttr, line, lineNum) {
				if (lastAttr > attrName) {
					var filePath = this.file.path;

					var regex = new RegExp('\\b' + lastAttr + '\\b.*?> ?<.*?' + attrName);

					var note = '';

					if (regex.test(line)) {
						note = '**';
					}

					if (!note || note && VERBOSE) {
						this.log(lineNum, sub('Sort attributes{2}: {0} {1}', lastAttr, attrName, note));
					}
				}
			},

			_attrGetMapEntry: function(lineNum) {
				var attrMapEntry = this._attrMap[lineNum];

				if (!attrMapEntry) {
					attrMapEntry = {};

					this._attrMap[lineNum] = attrMapEntry;
				}

				return attrMapEntry;
			},

			_attrRemoveScriptlets: function(line, lineNum) {
				var m = line.match(/<%.*?%>/g);

				var matches = m && m.map(
					function(item, index, collection) {
						line = line.replace(item, token + index + token);

						return item;
					}
				);

				var attrMapEntry = this._attrGetMapEntry(lineNum);

				attrMapEntry.matches = matches;

				return line;
			},

			_attrRemoveTags: function(line, lineNum) {
				var nsm = line.match(/<portlet:namespace \/>/);

				var nsMatches = nsm && nsm.map(
					function(item, index) {
						line = line.replace(item, nsToken + index + nsToken);

						return item;
					}
				);

				var attrMapEntry = this._attrGetMapEntry(lineNum);

				attrMapEntry.nsMatches = nsMatches;

				return line;
			},

			_attrRestoreScriptlets: function(line, lineNum) {
				var attrMapEntry = this._attrGetMapEntry(lineNum);

				var matches = attrMapEntry.matches;

				if (matches) {
					line = line.replace(
						new RegExp(token + '(\\d+)' + token, 'g'),
						function(str, id) {
							return matches[id];
						}
					);
				}

				return line;
			},

			_attrRestoreTags: function(line, lineNum) {
				var attrMapEntry = this._attrGetMapEntry(lineNum);

				var nsMatches = attrMapEntry.nsMatches;

				if (nsMatches) {
					line = line.replace(
						new RegExp(nsToken + '(\\d+)' + nsToken, 'g'),
						function(str, id) {
							return nsMatches[id];
						}
					);
				}

				return line;
			},

			_attrSortValues: function(attrName, attrValue, item, line, lineNum) {
				var instance = this;

				var styleAttr = (attrName == 'style');
				var onAttr = (attrName.indexOf('on') === 0);
				var labelAttr = (attrName.indexOf('label') === 0);

				var attrSep = ' ';

				if (styleAttr) {
					attrSep = /\s?;\s?/;
				}

				var attrValuePieces = attrValue.split(attrSep);

				var lastAttrPiece = -1;

				var sort = false;

				var filePath = this.file.path;

				attrValuePieces.forEach(
					function(item, index, collection) {
						item = item.trim();
						if (/^[A-Za-z]/.test(item)) {
							// Skip event handlers like onClick, etc since they will have
							// complex values that probably shouldn't be sorted
							if (!onAttr && !labelAttr && lastAttrPiece > item) {
								instance.log(lineNum, sub('Sort attribute values: {0} {1}',  lastAttrPiece, item));

								sort = true;
							}

							lastAttrPiece = item;
						}
					}
				);

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

				return item;
			},

			_jsHandleScriptletWhitespace: function(scriptBlock) {
				var contents = scriptBlock.contents;

				// Let's check to see if we have new new lines at the start
				// or end of a script block due to scriptlet blocks, ie:
				// <aui:script>
				//
				//  <% if() { %>
				// ...
				// <% } %>
				//
				// </aui:script>
				//
				// We should ignore those lines as they're valid for this case

				var lines = contents.split('\n');
				var numLines = lines.length;

				if (numLines >= 3) {
					if (lines[1] === '' && lines[2].indexOf(scriptletBlockOpen) > -1) {
						lines[1] = 'void 0;';
					}

					if (lines[numLines - 2] === '' && lines[numLines - 3].indexOf('void 0; */') > -1) {
						lines[numLines - 2] = 'void 0;';
					}
				}

				// If we have something like:
				// <%= obj.getJavaScript() %>
				// go ahead and assume it's okay to exist
				// on it's own line

				contents = lines.map(
					function(item, index) {
						if (re.REGEX_SCRIPTLET_STUB.test(item)) {
							item = '//' + item;
						}

						return item;
					}
				).join('\n');

				scriptBlock.contents = contents;

				return scriptBlock;
			},

			_jsIterateRules: function(scriptBlock) {
				var instance = this;

				var contents = scriptBlock.contents;
				var file = scriptBlock.file;
				var match = scriptBlock.match;
				var scriptAttrs = scriptBlock.scriptAttrs;
				var startLine = scriptBlock.startLine;
				var tagNamespace = scriptBlock.tagNamespace;

				var asyncAUIScript = tagNamespace && tagNamespace.indexOf('aui:') === 0 && scriptAttrs.indexOf('use="') > -1;

				iterateLines(
					contents,
					function(item, index) {
						var fullItem = item;
						var lineNum = startLine + index;

						item = item.trim();

						var context = {
							asyncAUIScript: asyncAUIScript,
							body: contents,
							file: file,
							fullMatch: match,
							item: item,
							lineNum: lineNum,
							scriptAttrs: scriptAttrs,
							tagNamespace: tagNamespace
						};

						fullItem = iterateRules('htmlJS', fullItem, context);
					}
				);

				return scriptBlock;
			},

			_jsPadLines: function(scriptBlock) {
				var prefix = new Array(scriptBlock.startLine).join('void 0;\n');

				scriptBlock.contents = prefix + scriptBlock.contents;

				return scriptBlock;
			},

			_jsRemoveScriptletBlocks: function(scriptBlock) {
				var rescanBlocks = [];

				var contents = scriptBlock.contents;

				contents = contents.replace(/\$\{.*?\}/g, jspLintStubs.elExpression)
							.replace(
								/<%[^>]+>/g,
								function(m, index) {
									var len = m.length;
									var retVal = m;

									// If the last portion of this block is not the closing
									// scriptlet, let's keep track that we should rescan this
									// eg. when we hit cases like:
									// <% List<String> foo = null; %>
									// the regex will stop at String>

									if (m.substr(len - 2, len - 1) === '%>') {
										retVal = getScriptletBlockReplacement(m.split('\n').length);
									}
									else {
										rescanBlocks.push(true);
									}

									return retVal;
								}
							).replace(/<\/?[A-Za-z0-9-_]+:[^>]+>/g, '/* jsp tag */');

				if (rescanBlocks.length) {
					var scriptBlockRe = /<%/g;
					var match;

					// We didn't find the closing %>, so let's iterate
					// over all of the characters from the start of the
					// remaining scriptlet blocks until we get to %>

					while (match = scriptBlockRe.exec(contents)) {
						var matchIndex = match.index;

						for (var i = matchIndex; i < contents.length; i++) {
							var item = contents.charAt(i);

							if (item && item == '>' && contents.charAt(i - 1) == '%') {
								var block = contents.substring(matchIndex, i + 1);

								contents = contents.replace(block, getScriptletBlockReplacement(block.split('\n').length));

								break;
							}
						}
					}
				}

				scriptBlock.contents = contents;

				return scriptBlock;
			},

			_processAttrs: function(line, lineNum) {
				var instance = this;

				var filePath = this.file.path;

				line = line.replace(
					/<[^>]+>/g,
					function(m, mi, str) {
						var attrs = m.match(/(?: )?([A-Za-z0-9-]+=(["']).*?\2)/g);

						if (attrs) {
							var lastAttr = -1;

							attrs.forEach(
								function(item, index, collection) {
									var oldItem = item;

									var pieces = item.trim().match(/^([^=]+)=(["'])(.*)\2$/);

									var attrName = pieces[1];
									var attrValue = pieces[3];

									instance._attrCheckOrder(attrName, lastAttr, line, lineNum);

									item = instance._attrSortValues(attrName, attrValue, item, line, lineNum);

									lastAttr = attrName;

									m = m.replace(oldItem, item);
								}
							);
						}

						return m;
					}
				);

				return line;
			}
		}
	}
);

module.exports = Formatter.HTML;