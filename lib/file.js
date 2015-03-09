var fs = require('fs');
var path = require('path');
var util = require('util');

var colors = require('./colors');

exports.handleFileReadError = function(err, file) {
	var errMsg = 'Could not open file';

	if (err.code === 'ENOENT') {
		errMsg = 'File does not exist';
	}

	return util.format('%s: %s', colors.error(errMsg), path.resolve(file));
};

exports.handleFileWriteError = function(err, file) {
	var errMsg = 'Could not write to file';

	if (file == '<input>') {
		errMsg = 'Can\'t write to <input> (no file name provided)';
	}
	else {
		file = path.resolve(file);
	}

	return util.format('%s: %s', colors.error(errMsg), file);
};