var _ = require('lodash');
var base = require('./base');
var re = require('./re');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

Formatter.CSS = Formatter.create(
	{
		excludes: /[_.-](soy|min|nocsf)\.[^.]+$/,
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			comparePropertySort: function(content, nextItem, context) {
				var re = this._re;

				var nextItemMatch;

				var contentMatch = content.match(REGEX.PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(REGEX.LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(REGEX.PROP_KEY);
				}

				if (contentMatch && nextItemMatch && contentMatch[1] > nextItemMatch[1]) {
					this.log(context.lineNum, sub('Sort: {0} {1}', content, nextItem));
				}

				return content;
			},

			format: function(contents) {
				var instance = this;

				var logger = this.log.bind(this);

				return iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);
			},

			formatPropertyItem: function(content) {
				return content.replace(REGEX.LEADING_SPACE, '').replace(REGEX.LEADING_INCLUDE, '');
			},

			processFile: function(content, index, collection, logger) {
				var re = this._re;

				var rawContent = content;

				content = content.trim();

				re.hasExtraNewLines(content, index, collection);

				var context = this._getContext(content, index, collection, logger);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('common', context);

				content = context.content = rawContent.trim();

				if (re.hasProperty(content)) {
					var processed = this.processProperty(rawContent, content, context.nextItem, context);

					content = processed.content;
					rawContent = processed.rawContent;
				}

				context.content = content;
				context.rawContent = rawContent;

				rawContent = re.iterateRules('css', context);

				content = rawContent.trim();

				return rawContent;
			},

			processProperty: function(rawContent, content, nextItem, context) {
				var re = this._re;

				content = this.formatPropertyItem(content);

				var propertyContext = _.assign(
					{},
					context,
					{
						content: content
					}
				);

				rawContent = re.iterateRules('css._properties', propertyContext);

				content = this.comparePropertySort(content, nextItem, context);

				return {
					content: content,
					rawContent: rawContent
				};
			},

			_getContext: function(content, index, collection, logger) {
				var lineNum = index + 1;
				var nextItem = collection[lineNum] && collection[lineNum].trim();
				var previousItem = null;

				if (index > 0) {
					previousItem = collection[index - 1];
					previousItem = previousItem && previousItem.trim();
				}

				var propertyRules = this._re.rules.css._properties;

				return context = {
					collection: collection,
					content: content,
					file: this.file,
					index: index,
					lineNum: lineNum,
					nextItem: nextItem,
					previousItem: previousItem
				};
			},
		}
	}
);

module.exports = Formatter.CSS;