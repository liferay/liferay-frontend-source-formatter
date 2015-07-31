var _ = require('lodash');
var base = require('../base');
var re = require('../re');

var Formatter = require('../formatter_base');

var iterateLines = base.iterateLines;
var sub = base.sub;

Formatter.CSS = Formatter.create(
	{
		extensions: /\.s?css$/,
		id: 'css',
		prototype: {
			comparePropertySort: function(item, nextItem, context) {
				var nextItemMatch;

				var itemMatch = item.match(re.REGEX_PROP_KEY);

				if (nextItem && re.hasProperty(nextItem)) {
					nextItem = nextItem.replace(re.REGEX_LEADING_SPACE, '');
					nextItemMatch = nextItem && re.hasProperty(nextItem) && nextItem.match(re.REGEX_PROP_KEY);
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
				return item.replace(re.REGEX_LEADING_SPACE, '').replace(re.REGEX_LEADING_INCLUDE, '');
			},

			postFormatPropertyItem: function(fullItem) {
				return this.formatPropertyItem(fullItem.trim());
			},

			processFile: function(item, index, collection, logger) {
				var fullItem = item;

				item = item.trim();

				re.hasExtraNewLines(item, index, collection, logger);

				var context = this._getContext(item, index, collection, logger);

				fullItem = re.iterateRules('common', fullItem, context);

				item = context.item = fullItem.trim();

				if (re.hasProperty(item)) {
					var processed = this.processProperty(fullItem, item, context.nextItem, context);

					fullItem = processed.fullItem;
					item = processed.item;
				}

				context.item = item;

				fullItem = re.iterateRules('css', fullItem, context);

				item = fullItem.trim();

				return fullItem;
			},

			processProperty: function(fullItem, item, nextItem, context) {
				item = this.formatPropertyItem(item);

				var propertyContext = _.assign(
					{},
					context,
					{
						formatItem: this.postFormatPropertyItem.bind(this),
						item: item
					}
				);

				fullItem = re.iterateRules('css._properties', fullItem, propertyContext);

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

				var rules = re.css;

				var propertyRules = rules._properties;

				return context = {
					collection: collection,
					file: this.file,
					index: index,
					item: item,
					lineNum: lineNum,
					logger: logger,
					nextItem: nextItem,
					previousItem: previousItem
				};
			},
		}
	}
);

module.exports = Formatter.CSS;