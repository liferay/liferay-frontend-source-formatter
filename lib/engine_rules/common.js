var colors = require('../colors');

var MAP_WHITESPACE = {
	'\xa0': ' ',
	'\x95': '',
	'\x99': ''
};

var REGEX_WHITESPACE_CHARS = new RegExp('(' + Object.keys(MAP_WHITESPACE).join('|') + ')', 'g');

module.exports = {
	mixedSpaces: {
		message: 'Mixed spaces and tabs: {1}',
		regex: /^.*( \t|\t ).*$/,
		replacer: function(fullItem, result, rule) {
			fullItem = fullItem.replace(
				/(.*)( +\t|\t +)(.*)/g,
				function(str, prefix, problem, suffix) {
					problem = problem.replace(/ {4}| {2}/g, '\t').replace(/ /g, '');

					return prefix + problem + suffix;
				}
			);

			return fullItem;
		},
		testFullItem: true
	},
	invalidWhiteSpace: {
		MSG: 'Invalid whitespace characters',
		message: function(lineNum, item, result, rule) {
			var displayedItem = item.replace(
				new RegExp(rule.regex.source, 'g'),
				colors.bgError('$1')
			);

			return this.message(rule.MSG + ': {1}', lineNum, displayedItem, result, rule);
		},
		regex: REGEX_WHITESPACE_CHARS,
		replacer: function(fullItem, result, rule) {
			return fullItem.replace(
				rule.regex,
				function(str, m) {
					return MAP_WHITESPACE[m];
				}
			);
		},
		testFullItem: true
	},
	_MAP_WHITESPACE: MAP_WHITESPACE
};