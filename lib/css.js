var base = require('./base');
var re = require('./re');

var Formatter = require('./formatter_base');

var A = base.A;

var iterateLines = base.iterateLines;
var sub = base.sub;

Formatter.CSS = Formatter.create(
	{
		extensions: '*.?(s)css',
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

				var filePath = this.file;

				re.hasExtraNewLines(item, index, collection, logger);

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
					file: filePath,
					item: item,
					lineNum: lineNum,
					logger: logger,
					nextItem: nextItem,
					previousItem: previousItem
				};

				fullItem = re.iterateRules('common', fullItem, context);

				item = context.item = fullItem.trim();

				if (re.hasProperty(item)) {
					var processed = this.processProperty(fullItem, item, nextItem, context);

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

				var propertyContext = A.merge(
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
			}
		}
	}
);

module.exports = Formatter.CSS;