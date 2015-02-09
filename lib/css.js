var argv = require('./argv');
var base = require('./base');
var re = require('./re');

var Formatter = require('./formatter_base');

var A = base.A;

var iterateLines = base.iterateLines;
var sub = base.sub;
var trackErr = base.trackErr;

var iterateRules = re.iterateRules;

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

				if (itemMatch && nextItemMatch) {
					if (itemMatch[1] > nextItemMatch[1]) {
						trackErr(sub('Line: {0} Sort: {1} {2}', context.lineNum, item, nextItem).warn, context.file);
					}
				}

				return item;
			},

			format: function(contents, file) {
				return iterateLines(contents, this.processFile.bind(this, file || this.file.path));
			},

			formatPropertyItem: function(item) {
				return item.replace(re.REGEX_LEADING_SPACE, '').replace(re.REGEX_LEADING_INCLUDE, '');
			},

			processFile: function(file, item, index, collection) {
				var fullItem = item;

				item = item.trim();

				re.hasExtraNewLines(item, index, collection, file);

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
					file: file,
					item: item,
					lineNum: lineNum,
					nextItem: nextItem,
					previousItem: previousItem
				};

				fullItem = iterateRules('common', fullItem, context);

				item = context.item = fullItem.trim();

				if (re.hasProperty(item)) {
					var processed = this.processProperty(fullItem, item, nextItem, context);

					fullItem = processed.fullItem;
					item = processed.item;
				}

				context.item = item;

				fullItem = iterateRules('css', fullItem, context);

				item = fullItem.trim();

				return fullItem;
			},

			postFormatPropertyItem: function(fullItem) {
				return this.formatPropertyItem(fullItem.trim());
			},

			processProperty: function(fullItem, item, nextItem, context) {
				item = this.formatPropertyItem(item);

				var propertyContext = A.merge(
					context,
					{
						formatItem: this.postFormatPropertyItem,
						item: item
					}
				);

				fullItem = iterateRules('css._properties', fullItem, propertyContext);

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