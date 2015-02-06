var base = require('./base');
var A = base.A;
var Logger = require('./logger');

// Expects a File object

var Formatter = function(file, logger) {
	this.file = file;
	this.logger = logger || Logger;
};

Formatter.prototype = {
	format: function(contents) {
		return contents;
	},

	log: function(line, err, type) {
		this.logger.log(line, err, this.file.path, type);
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

Formatter.HTML = Formatter.create(
	{
		extensions: '*.+(jsp*|htm*|vm|ftl|tpl|tmpl)',
		id: 'html',
		prototype: {
			format: require('./html')
		}
	}
);

Formatter.CSS = Formatter.create(
	{
		extensions: '*.?(s)css',
		id: 'css',
		prototype: {
			format: require('./css')
		}
	}
);

Formatter.JS = Formatter.create(
	{
		extensions: '*.js',
		id: 'js',
		prototype: {
			format: require('./js')
		}
	}
);


// var minimatch = require('minimatch');
// var ext = '*.?(s)css';
// var ext = Formatter.HTML.extensions;

// 'js|css|scss|jsp|html|htm|vm|ftl|tpl|tmpl|jspf'.split('|').forEach(
// 	function(item, index) {
// 		var file = '/Users/ncavanaugh/Dev/Liferay/bar.' + item;

// 		console.log('"%s" %s %s', file, (minimatch(file, ext, {nocase: true, matchBase: true}) ? 'matches' : 'does not match'), ext);
// 	}
// );

module.exports = Formatter;