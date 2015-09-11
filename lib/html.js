var base = require('./base');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

var jspLintStubs = base.jspLintStubs;

var scriptletBlockOpen = '/* scriptlet block ';
var scriptletBlockClose = ' */';

require('./js');

Formatter.HTML = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.[^.]+$/,
		id: 'html',
		includes: /\.(jsp.*|htm.*|vm|ftl|tag|tpl|tmpl|hbs|soy)$/,
		prototype: {
			init: function(file, logger, flags) {
				this._attrMap = {};
			},

			extractCSS: function(contents) {
				var filePath = this.file;

				var styleBlocks = [];

				var re = this._re;

				var hasCSS = (REGEX.STYLE).test(contents);

				if (hasCSS) {
					var reStyleGlobal = new RegExp(REGEX.STYLE.source, 'g');

					var newContents = contents.replace(/<%.*?%>/gim, jspLintStubs.scriptlet)
										.replace(/<%=[^>]+>/g, jspLintStubs.echoScriptlet)
										.replace(/<portlet:namespace \/>/g, jspLintStubs.namespace);

					newContents.replace(
						reStyleGlobal,
						function(m, tagName, styleAttrs, body, index) {
							if (!body) {
								return;
							}

							var lines = newContents.substring(0, index).split('\n').length;

							styleBlocks.push(
								{
									contents: body,
									file: filePath,
									match: m,
									styleAttrs: styleAttrs,
									startLine: lines
								}
							);
						}
					);
				}

				return styleBlocks;
			},

			extractJs: function(contents) {
				var filePath = this.file;

				var scriptBlocks = [];

				var re = this._re;

				var hasJs = (REGEX.AUI_SCRIPT).test(contents);

				if (hasJs) {
					var reAUIScriptGlobal = new RegExp(REGEX.AUI_SCRIPT.source, 'g');

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

				instance.parseCSS(contents);
				instance.parseJs(contents);

				var filePath = instance.file;

				var logger = instance.log.bind(instance);

				var re = instance._re;

				return iterateLines(
					contents,
					function(content, index, collection) {
						var rawContent = content;

						content = content.trim();

						re.hasExtraNewLines(content, index, collection);

						var lineNum = index + 1;

						var filteredItem = rawContent;

						filteredItem = instance._attrRemoveScriptlets(filteredItem, lineNum);
						filteredItem = instance._attrRemoveTags(filteredItem, lineNum);

						filteredItem = instance._processAttrs(filteredItem, lineNum);

						rawContent = filteredItem;

						rawContent = instance._attrRestoreScriptlets(rawContent, lineNum);
						rawContent = instance._attrRestoreTags(rawContent, lineNum);

						var context = {
							content: content,
							file: filePath,
							lineNum: lineNum,
							rawContent: rawContent
						};

						rawContent = re.iterateRules('common', context);

						context.rawContent = rawContent;

						rawContent = re.iterateRules('html', context);

						return rawContent;
					}
				);
			},

			formatCSS: function(styleBlocks) {
				var cssFormatter = new Formatter.CSS(this.file, this.logger, this.flags);

				return styleBlocks.map(
					function(item, index) {
						return cssFormatter.format(item.contents);
					}
				);
			},

			formatJs: function(scriptBlocks) {
				var jsFormatter = new Formatter.JS(this.file, this.logger, this.flags);
				var esLintConfig = require('./eslint_config_jsp');

				jsFormatter.lintLogFilter = this._jsLogFilter.bind(this);

				return scriptBlocks.map(
					function(item, index) {
						return jsFormatter.format(item.contents, esLintConfig);
					}
				);
			},

			parseCSS: function(contents) {
				var styleBlocks = this.extractCSS(contents);

				styleBlocks = this.sanitizeStyleBlocks(styleBlocks);
				styleBlocks = this.formatCSS(styleBlocks);

				return styleBlocks;
			},

			parseJs: function(contents) {
				var scriptBlocks = this.extractJs(contents);

				scriptBlocks = this.sanitizeScriptBlocks(scriptBlocks);
				scriptBlocks = this.formatJs(scriptBlocks);

				return scriptBlocks;
			},

			sanitizeScriptBlocks: function(scriptBlocks) {
				var instance = this;

				var token = 'void 0;';

				scriptBlocks = scriptBlocks.map(
					function(item, index) {
						var contents = item.contents;

						item = instance._jsIterateRules(item);
						item = instance._jsRemoveScriptletBlocks(item);
						item = instance._jsHandleScriptletWhitespace(item);
						item = instance._jsPadLines(item, token);

						return item;
					}
				);

				return scriptBlocks;
			},

			sanitizeStyleBlocks: function(styleBlocks) {
				var instance = this;

				var token = 'void: 0;';

				styleBlocks = styleBlocks.map(
					function(item, index) {
						var contents = item.contents;

						item = instance._jsRemoveScriptletBlocks(item);
						item = instance._jsHandleScriptletWhitespace(item);
						item = instance._jsPadLines(item, token);

						return item;
					}
				);

				return styleBlocks;
			},

			_attrCheckOrder: function(attrName, lastAttr, line, lineNum) {
				var needsSort = false;

				if (lastAttr > attrName) {
					var filePath = this.file;

					var regex = new RegExp('\\b' + lastAttr + '\\b.*?> ?<.*?' + attrName);

					var note = '';

					if (regex.test(line)) {
						note = '**';
					}

					if (!note || note && this.flags.verbose) {
						this.log(lineNum, sub('Sort attributes{2}: {0} {1}', lastAttr, attrName, note));

						needsSort = true;
					}
				}

				return needsSort;
			},

			_attrCleanTokens: function(value) {
				var token = this._TOKEN;
				var nsToken = this._NS_TOKEN;

				value = value.replace(new RegExp(token + '(\\d+)' + token, 'g'), '<%...%>');
				value = value.replace(new RegExp(nsToken + '(\\d+)' + nsToken, 'g'), '<po.../>');

				return value;
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
				var token = this._TOKEN;

				var index = 0;

				var mapTokens = function(item) {
					line = line.replace(item, token + (index++) + token);

					return item;
				};

				var matches = [
					/<%.*?%>/g,
					/\$\{.*?\}/g,
					/\{{1,3}[^}]+\}{1,3}/g
				].reduce(
					function(prev, item, index) {
						var m = line.match(item);

						var matches = m && m.map(mapTokens);

						if (matches) {
							prev = prev.concat(matches);
						}

						return prev;
					},
					[]
				);

				var attrMapEntry = this._attrGetMapEntry(lineNum);

				if (matches.length) {
					attrMapEntry.matches = matches;
				}

				return line;
			},

			_attrRemoveTags: function(line, lineNum) {
				var nsm = line.match(/<portlet:namespace \/>/);

				var nsToken = this._NS_TOKEN;

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
					var token = this._TOKEN;

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
					var nsToken = this._NS_TOKEN;

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

				var hasScript = (attrValue.indexOf('javascript:') === 0);

				var attrSep = ' ';

				if (styleAttr) {
					attrSep = /\s?;\s?/;
				}

				var attrValuePieces = attrValue.split(attrSep);

				var lastAttrPiece = -1;

				var sort = false;

				var filePath = this.file;

				attrValuePieces.forEach(
					function(item, index, collection) {
						item = item.trim();
						if (/^[A-Za-z]/.test(item)) {
							// Skip event handlers like onClick, labels, or any attr value
							// starting with javascript:;, etc since they will have
							// complex values that probably shouldn't be sorted
							if (!hasScript && !onAttr && !labelAttr && lastAttrPiece > item) {
								var tmpLastAttrPiece = instance._attrCleanTokens(lastAttrPiece);
								var tmpItem = instance._attrCleanTokens(item);

								instance.log(lineNum, sub('Sort attribute values: {0} {1}',  tmpLastAttrPiece, tmpItem));

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

			_getScriptletBlockReplacement: function(length) {
				return scriptletBlockOpen + (new Array(length).join('\nvoid 0;')) + scriptletBlockClose;
			},

			_jsCommentSingleLineScriptlets: function(lines) {
				var re = this._re;

				return lines.map(
					function(item, index) {
						if (REGEX.SCRIPTLET_STUB.test(item)) {
							item = '//' + item;
						}

						return item;
					}
				);
			},

			_jsFindScriptletBlock: function(contents) {
				var scriptBlockRe = /<%/g;
				var match;

				// We didn't find the closing %>, so let's iterate
				// over all of the characters from the start of the
				// remaining scriptlet blocks until we get to %>

				while (match = scriptBlockRe.exec(contents)) {
					contents = this._jsFindScriptletClose(contents, match.index);
				}

				return contents;
			},

			_jsFindScriptletClose: function(contents, matchIndex) {
				for (var i = matchIndex; i < contents.length; i++) {
					var item = contents.charAt(i);

					if (this._jsIsScriptletCloseToken(item, contents.charAt(i - 1))) {
						var block = contents.substring(matchIndex, i + 1);

						contents = contents.replace(block, this._getScriptletBlockReplacement(block.split('\n').length));

						break;
					}
				}

				return contents;
			},

			_jsIgnoreEndNewlines: function(lines) {
				var numLines = lines.length;

				if (lines[numLines - 2] === '' && lines[numLines - 3].indexOf('void 0; */') > -1) {
					lines[numLines - 2] = 'void 0;';
				}

				return lines;
			},

			_jsIgnoreStartNewlines: function(lines) {
				var numLines = lines.length;

				if (lines[1] === '' && lines[2].indexOf(scriptletBlockOpen) > -1) {
					lines[1] = 'void 0;';
				}

				return lines;
			},

			_jsIsScriptletCloseToken: function(item, prev) {
				return item && item == '>' && prev == '%';
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
					lines = this._jsIgnoreStartNewlines(lines);
					lines = this._jsIgnoreEndNewlines(lines);
				}

				// If we have something like:
				// <%= obj.getJavaScript() %>
				// go ahead and assume it's okay to exist
				// on it's own line

				contents = this._jsCommentSingleLineScriptlets(lines).join('\n');

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

				var logger = instance.log.bind(instance);

				var re = instance._re;

				iterateLines(
					contents,
					function(content, index) {
						var rawContent = content;
						var lineNum = startLine + index;

						content = content.trim();

						var context = {
							asyncAUIScript: asyncAUIScript,
							body: contents,
							content: content,
							file: file,
							fullMatch: match,
							lineNum: lineNum,
							rawContent: rawContent,
							scriptAttrs: scriptAttrs,
							tagNamespace: tagNamespace
						};

						rawContent = re.iterateRules('htmlJS', context);
					}
				);

				return scriptBlock;
			},

			_jsLogFilter: function(item) {
				var message = item.message;

				item.message = item.message.replace(/\b_PN_(\w+)\b/g, '<portlet:namespace />$1');

				return item;
			},

			_jsPadLines: function(scriptBlock, token) {
				var prefix = new Array(scriptBlock.startLine).join(token + '\n');

				scriptBlock.contents = prefix + scriptBlock.contents;

				return scriptBlock;
			},

			_jsRemoveScriptletBlocks: function(scriptBlock) {
				var instance = this;

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
										retVal = instance._getScriptletBlockReplacement(m.split('\n').length);
									}
									else {
										rescanBlocks.push(true);
									}

									return retVal;
								}
							).replace(/<\/?[A-Za-z0-9-_]+:[^>]+>/g, '/* jsp tag */');

				if (rescanBlocks.length) {
					contents = instance._jsFindScriptletBlock(contents);
				}

				scriptBlock.contents = contents;

				return scriptBlock;
			},

			_processAttrs: function(line, lineNum) {
				var instance = this;

				var filePath = this.file;

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
			},

			_NS_TOKEN: String.fromCharCode(-2),
			_TOKEN: String.fromCharCode(-1)
		}
	}
);

module.exports = Formatter.HTML;