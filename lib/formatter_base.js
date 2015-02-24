var base = require('./base');
var A = base.A;
var Logger = require('./logger');
var File = require('./file');

// Expects a File object

var Formatter = function(file, logger) {
	if (A.Lang.isString(file)) {
		file = new File(file);
	}

	this.file = file;
	this.logger = logger || Logger;

	if (A.Lang.isFunction(this.init)) {
		this.init(file, logger);
	}
};

Formatter.prototype = {
	format: function(contents) {
		return contents;
	},

	log: function(line, msg, type, props) {
		this.logger.log(line, msg, this.file.path, type, props);
	}
};

Formatter._registered = {};

Formatter.create = function(obj) {
	if (!A.Lang.isObject(obj)) {
		throw Error('You must pass an object to Formatter.create');
	}

	var constructor;

	if (obj.hasOwnProperty('constructor')) {
		constructor = obj.constructor;

		delete obj.constructor;
	}
	else {
		constructor = function() {
			return Formatter.apply(this, arguments);
		};
	}

	var proto = Object.create(Formatter.prototype);

	var customProto = obj.prototype;

	delete obj.prototype;

	A.mix(proto, customProto, true);

	proto.constructor = constructor;

	constructor.prototype = proto;

	var id = obj.id;

	if (!id || Formatter._registered.hasOwnProperty(id)) {
		var errMsg = base.sub('The id: "{0}" is already taken', id);

		if (!id) {
			errMsg = 'You must give this formatter an id with the id property';
		}

		throw Error(errMsg);
	}

	var extensions = obj.extensions;

	if (!A.Lang.isString(extensions) || !extensions.length) {
		throw Error('The extensions property must be a string, and must be glob expression');
	}

	A.mix(constructor, obj, true);

	Formatter._registered[id] = constructor;

	return constructor;
};

module.exports = Formatter;