var colors = require('colors');
var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');

var base = require('./base');
var A = base.A;


var TPL;

var Logger = {
	fileErrors: {},
	testStats: 0,
	getErrors: function(file) {
		var instance = this;

		if (A.Lang.isObject(file) && file.path) {
			file = file.path;
		}

		return this.fileErrors[file] || [];
	},

	log: function(line, err, file, type) {
		var fileErrors = this.fileErrors;

		var errors = fileErrors[file];

		this.testStats.failures++;

		if (!errors) {
			errors = [];

			fileErrors[file] = errors;
		}

		errors.push(
			{
				msg: err,
				line: line,
				type: type
			}
		);
	},

	render: function(file, showBanner) {
		if (typeof TPL === 'undefined') {
			TPL = fs.readFileSync(path.join(__dirname, 'tpl/cli.tpl'), 'utf-8');
		}

		var logTpl = handlebars.compile(TPL);

		var errors = this.getErrors(file);

		var tplContext = {
			errors: errors,
			file: file.path || file,
			showBanner: errors.length || !showBanner
		};

		var out = logTpl(tplContext);

		console.log(out);
	}
};

Object.keys(String.prototype).forEach(
	function(item, index) {
		handlebars.registerHelper(
			item,
			function(options) {
				return colors[item](options.fn(this));
			}
		);
	}
);

handlebars.registerHelper(
	'color',
	function(options) {
		return colors[this.type || 'warn'](options.fn(this));
	}
);

handlebars.registerHelper(
	'line',
	function(options) {
		var line = this.line;
		var text = 'Line';

		if (Array.isArray(line)) {
			line = line.join('-');
			text = 'Lines';
		}

		return text + ' ' + line;
	}
);

handlebars.registerHelper(
	'banner',
	function(options) {
		var content = options.fn(this);

		if (!this.showBanner) {
			content = '';
		}

		return content;
	}
);

module.exports = Logger;