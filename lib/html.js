var argv = require('./argv');
var base = require('./base');
var re = require('./re');

var Formatter = require('./formatter_base');

var iterateLines = base.iterateLines;
var sub = base.sub;
var trackErr = base.trackErr;

var jspLintStubs = base.jspLintStubs;

var iterateRules = re.iterateRules;

var VERBOSE = argv.v;

var scriptletBlockOpen = '/* scriptlet block ';
var scriptletBlockClose = ' */';

var getScriptletBlockReplacement = function(length) {
	return scriptletBlockOpen + (new Array(length).join('\nvoid 0;')) + scriptletBlockClose;
};

var checkJs = require('./js');

var checkHTML = function(contents, file) {
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

				var lineStart = newContents.substring(0, index).split('\n').length;

				var asyncAUIScript = tagNamespace && tagNamespace.indexOf('aui:') === 0 && scriptAttrs.indexOf('use="') > -1;

				iterateLines(
					body,
					function(item, index) {
						var fullItem = item;
						var lineNum = lineStart + index;

						item = item.trim();

						var context = {
							asyncAUIScript: asyncAUIScript,
							body: body,
							file: file,
							fullMatch: m,
							item: item,
							lineNum: lineNum,
							scriptAttrs: scriptAttrs,
							tagNamespace: tagNamespace
						};

						fullItem = iterateRules('htmlJS', fullItem, context);
					}
				);

				var rescanBlocks = [];

				body = body.replace(/\$\{.*?\}/g, jspLintStubs.elExpression)
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

					while (match = scriptBlockRe.exec(body)) {
						var matchIndex = match.index;

						for (var i = matchIndex; i < body.length; i++) {
							var item = body.charAt(i);

							if (item && item == '>' && body.charAt(i - 1) == '%') {
								var block = body.substring(matchIndex, i + 1);

								body = body.replace(block, getScriptletBlockReplacement(block.split('\n').length));

								break;
							}
						}
					}
				}

				var lines = newContents.substring(0, index).split('\n').length;
				var prefix = new Array(lines).join('void 0;\n');

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

				var bodyLines = body.split('\n');
				var bodyLineLength = bodyLines.length;

				if (bodyLineLength >= 3) {
					if (bodyLines[1] === '' && bodyLines[2].indexOf(scriptletBlockOpen) > -1) {
						bodyLines[1] = 'void 0;';
					}

					if (bodyLines[bodyLineLength - 2] === '' && bodyLines[bodyLineLength - 3].indexOf('void 0; */') > -1) {
						bodyLines[bodyLineLength - 2] = 'void 0;';
					}
				}

				// If we have something like:
				// <%= obj.getJavaScript() %>
				// go ahead and assume it's okay to exist
				// on it's own line

				body = bodyLines.map(
					function(item, index) {
						if (re.REGEX_SCRIPTLET_STUB.test(item)) {
							item = '//' + item;
						}

						return item;
					}
				).join('\n');

				checkJs(prefix + body, file, require('./eslint_config_jsp'));
			}
		);
	}

	return iterateLines(
		contents,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			re.hasExtraNewLines(item, index, collection, file);

			var lineNum = index + 1;

			var token = String.fromCharCode(-1);
			var nsToken = String.fromCharCode(-2);

			var m = fullItem.match(/<%.*?%>/g);

			var filteredItem = fullItem;

			var matches = m && m.map(
				function(item, index, collection) {
					filteredItem = filteredItem.replace(item, token + index + token);

					return item;
				}
			);

			var nsm = filteredItem.match(/<portlet:namespace \/>/);

			var nsMatches = nsm && nsm.map(
				function(item, index) {
					filteredItem = filteredItem.replace(item, nsToken + index + nsToken);

					return item;
				}
			);

			filteredItem = filteredItem.replace(
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

								if (lastAttr > attrName) {
									var re = new RegExp('\\b' + lastAttr + '\\b.*?> ?<.*?' + attrName);

									var note = '';

									if (re.test(fullItem)) {
										note = '**';
									}

									if (!note || note && VERBOSE) {
										trackErr(sub('Line {0} Sort attributes{3}: {1} {2}', lineNum, lastAttr, attrName, note).warn, file);
									}
								}

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

								m = m.replace(oldItem, item);
							}
						);
					}

					return m;
				}
			);

			fullItem = filteredItem;

			if (matches || nsMatches) {
				if (matches) {
					fullItem = fullItem.replace(
						new RegExp(token + '(\\d+)' + token, 'g'),
						function(str, id) {
							return matches[id];
						}
					);
				}

				if (nsMatches) {
					fullItem = fullItem.replace(
						new RegExp(nsToken + '(\\d+)' + nsToken, 'g'),
						function(str, id) {
							return nsMatches[id];
						}
					);
				}
			}

			var context = {
				file: file,
				item: item,
				lineNum: lineNum
			};

			fullItem = iterateRules('html', fullItem, context);

			return fullItem;
		}
	);
};

Formatter.HTML = Formatter.create(
	{
		extensions: '*.+(jsp*|htm*|vm|ftl|tpl|tmpl)',
		id: 'html',
		prototype: {
			format: checkHTML
		}
	}
);

module.exports = checkHTML;