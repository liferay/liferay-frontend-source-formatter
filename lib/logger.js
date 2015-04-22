var _ = require('lodash');
var fs = require('fs');
var Handlebars = require('handlebars');
var path = require('path');

var colors = require('./colors');

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

	var retVal = 0;

	if (aNum < bNum) {
		retVal = -1;
	}
	else if (aNum > bNum) {
		retVal = 1;
	}

	return retVal;
};

var REGEX_NON_SPACE = /\S/;

var Logger = function() {
	this.TPL_PATH = path.join(__dirname, 'tpl/cli.tpl');

	this.fileErrors = {};

	this.testStats = {
		failures: 0
	};

	this.verboseDetails = {};
};

Logger.prototype = {
	Logger: Logger,

	getErrors: function(file) {
		var fileErrors;

		if (_.isUndefined(file)) {
			fileErrors = this.fileErrors;
		}
		else {
			fileErrors = this.fileErrors[file];

			if (!fileErrors) {
				fileErrors = [];

				fileErrors.errorMap = {};

				this.fileErrors[file] = fileErrors;
			}
		}

		return fileErrors;
	},

	log: function(line, msg, file, type, props) {
		var errors = this.getErrors(file);

		var errorMap = errors.errorMap;

		var errorKey = line + msg;

		if (!errorMap[errorKey]) {
			this.testStats.failures++;

			var error = {
				line: line,
				msg: msg,
				type: type
			};

			if (_.isObject(props)) {
				_.defaults(error, props);
			}

			errors.push(error);
			errorMap[errorKey] = true;
		}
	},

	render: function(file, config) {
		config = config || {};

		var logTpl = this._getTPL();

		var errors = this.getErrors(file);

		errors.sort(sortErrors);

		var tplContext = {
			errors: errors,
			file: this._getFilePath(file, config),
			showBanner: errors.length || !config.showBanner,
			showLintIds: config.showLintIds
		};

		var out = logTpl(tplContext);

		if (!REGEX_NON_SPACE.test(out)) {
			out = '';
		}

		return out;
	},

	renderFileNames: function(file, config) {
		config = config || {};

		var errors = this.getErrors(file);

		var out = '';

		if (errors.length) {
			out = this._getFilePath(file, config);
		}

		return out;
	},

	_getFilePath: function(file, config) {
		var relative = config.relative;

		if (relative) {
			file = path.relative(relative, file);
		}

		return file;
	},

	_getTPL: function() {
		var tplFn = this.TPL_FN;

		if (!tplFn) {
			var tplContent = this._getTPLContent();

			tplFn = Handlebars.compile(tplContent);

			this.TPL_FN = tplFn;
		}

		return tplFn;
	},

	_getTPLContent: function() {
		var tpl = this.TPL;

		if (!tpl) {
			tpl = fs.readFileSync(this.TPL_PATH, 'utf-8');

			this.TPL = tpl;
		}

		return tpl;
	}
};

Object.defineProperty(
	Logger.prototype,
	'TPL',
	{
		get: function() {
			return this._TPL;
		},
		set: function(val) {
			this._TPL = val;

			this.TPL_FN = null;
		}
	}
);

Object.defineProperty(
	Logger.prototype,
	'TPL_PATH',
	{
		get: function() {
			return this._TPL_PATH;
		},
		set: function(val) {
			this._TPL_PATH = val;

			this.TPL = null;
		}
	}
);

Object.keys(colors.styles).forEach(
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

		if (!_.isFunction(colors[colorStyle])) {
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
	function(a, b, options) {
		var retVal;

		if (a && b) {
			retVal = options.fn(this);
		}
		else {
			retVal = options.inverse(this);
		}

		return retVal;
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