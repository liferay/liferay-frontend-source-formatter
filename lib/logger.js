var colors = require('colors');
var fs = require('fs');
var Handlebars = require('handlebars');
var path = require('path');

var base = require('./base');
var A = base.A;

var getLineNumber = function(error) {
	var line = error.line;

	if (Array.isArray(line)) {
		line = line[0];
	}

	return line;
};

var sortErrors = function(a, b) {
	var aNum = getLineNumber(a);
	var bNum = getLineNumber(b);

	return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
};

var TPL;

var REGEX_NON_SPACE = /\S/;

var Logger = function() {
	this.fileErrors = {};
	this.testStats = 0;
};

Logger.prototype = {
	Logger: Logger,

	getErrors: function(file) {
		var instance = this;

		var fileErrors;

		if (A.Lang.isUndefined(file)) {
			fileErrors = this.fileErrors;
		}
		else {
			if (A.Lang.isObject(file) && file.path) {
				file = file.path;
			}

			fileErrors = this.fileErrors[file] || [];
		}

		return fileErrors;
	},

	log: function(line, msg, file, type, props) {
		var fileErrors = this.fileErrors;

		var errors = fileErrors[file];

		this.testStats.failures++;

		if (!errors) {
			errors = [];

			fileErrors[file] = errors;
		}

		var error = {
			msg: msg,
			line: line,
			type: type
		};

		if (A.Lang.isObject(props)) {
			A.mix(error, props);
		}

		errors.push(error);
	},

	render: function(file, config) {
		config = config || {};

		if (typeof TPL === 'undefined') {
			TPL = fs.readFileSync(path.join(__dirname, 'tpl/cli.tpl'), 'utf-8');
		}

		var logTpl = Handlebars.compile(TPL);

		var errors = this.getErrors(file);

		errors.sort(sortErrors);

		var tplContext = {
			errors: errors,
			file: file.path || file,
			showBanner: errors.length || !config.showBanner,
			showLintIds: config.showLintIds
		};

		var out = logTpl(tplContext);

		if (REGEX_NON_SPACE.test(out)) {
			console.log(out);
		}
	},

	renderFileNames: function(file, config) {
		var instance = this;

		config = config || {};

		var errors = this.getErrors(file);

		if (errors.length) {
			var filePath = file.path;

			var relative = config.relative;

			if (relative) {
				filePath = path.relative(relative, filePath);
			}

			console.log(filePath);
		}
	}
};

Object.keys(String.prototype).forEach(
	function(item, index) {
		Handlebars.registerHelper(
			item,
			function(options) {
				return colors[item](options.fn(this));
			}
		);
	}
);

Handlebars.registerHelper(
	'color',
	function(options) {
		var colorStyle = this.type;

		if (!colors.hasOwnProperty(colorStyle)) {
			colorStyle = 'warn';
		}

		return colors[colorStyle](options.fn(this));
	}
);

Handlebars.registerHelper(
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

Handlebars.registerHelper(
	'and',
	function (a, b, options) {
		if (a && b) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	}
);

Handlebars.registerHelper(
	'banner',
	function(options) {
		var content = options.fn(this);

		if (!this.showBanner) {
			content = '';
		}

		return content;
	}
);

module.exports = new Logger();