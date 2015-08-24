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
				return this.formatPropertyItem(context.fullItem.trim());
			},

			processFile: function(item, index, collection, logger) {
				var re = this._re;

				var fullItem = item;

				item = item.trim();

				re.hasExtraNewLines(item, index, collection);

				var context = this._getContext(item, index, collection, logger);

				context.fullItem = fullItem;

				fullItem = re.iterateRules('common', context);

				item = context.item = fullItem.trim();

				if (re.hasProperty(item)) {
					var processed = this.processProperty(fullItem, item, context.nextItem, context);

					fullItem = processed.fullItem;
					item = processed.item;
				}

				context.fullItem = fullItem;
				context.item = item;

				fullItem = re.iterateRules('css', context);

				item = fullItem.trim();

				return fullItem;
			},

			processProperty: function(fullItem, item, nextItem, context) {
				var re = this._re;

				item = this.formatPropertyItem(item);

				var propertyContext = _.assign(
					{},
					context,
					{
						formatItem: this.postFormatPropertyItem.bind(this),
						item: item
					}
				);

				fullItem = re.iterateRules('css._properties', propertyContext);

				item = this.comparePropertySort(item, nextItem, context);

				return {
					fullItem: fullItem,
					item: item
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
					file: this.file,
					index: index,
					item: item,
					lineNum: lineNum,
					nextItem: nextItem,
					previousItem: previousItem
				};
			},
		}
	}
);

module.exports = Formatter.CSS;