var _ = require('lodash');
var base = require('./base');
var re = require('./re');

var REGEX = require('./regex');

var Formatter = require('content-formatter');

var iterateLines = base.iterateLines;
var sub = require('string-sub');

Formatter.CSS = Formatter.create(
	{
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			comparePropertySort: function(item, nextItem, context) {
				var re = this._re;

				var nextItemMatch;

				var itemMatch = item.match(REGEX.PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(REGEX.LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(REGEX.PROP_KEY);
				}

				if (itemMatch && nextItemMatch && itemMatch[1] > nextItemMatch[1]) {
					this.log(context.lineNum, sub('Sort: {0} {1}', item, nextItem));
				}

				return item;
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

			formatPropertyItem: function(item) {
				return item.replace(REGEX.LEADING_SPACE, '').replace(REGEX.LEADING_INCLUDE, '');
			},

			postFormatPropertyItem: function(context) {
				return this.formatPropertyItem(context.rawContent.trim());
			},

			processFile: function(item, index, collection, logger) {
				var re = this._re;

				var rawContent = item;

				item = item.trim();

				re.hasExtraNewLines(item, index, collection);

				var context = this._getContext(item, index, collection, logger);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('common', context);

				item = context.content = rawContent.trim();

				if (re.hasProperty(item)) {
					var processed = this.processProperty(rawContent, item, context.nextItem, context);

					item = processed.content;
					rawContent = processed.rawContent;
				}

				context.content = item;
				context.rawContent = rawContent;

				rawContent = re.iterateRules('css', context);

				item = rawContent.trim();

				return rawContent;
			},

			processProperty: function(rawContent, item, nextItem, context) {
				var re = this._re;

				item = this.formatPropertyItem(item);

				var propertyContext = _.assign(
					{},
					context,
					{
						formatItem: this.postFormatPropertyItem.bind(this),
						content: item
					}
				);

				rawContent = re.iterateRules('css._properties', propertyContext);

				item = this.comparePropertySort(item, nextItem, context);

				return {
					content: item,
					rawContent: rawContent
				};
			},

			_getContext: function(item, index, collection, logger) {
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
					content: item,
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