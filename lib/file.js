var fs = require('fs');
var path = require('path');
var util = require('util');
var Promise = require('bluebird');

Promise.promisifyAll(fs);

function File(filePath) {
	this.path = filePath;
	this._contents = '';
	this._origContents = '';
}

File.prototype = {
	format: function(formatter) {
		var format = this.read().then(
			function(data) {
				return formatter.format(data, this.path);
			}
		).then(
			function(data) {
				return (this._contents = data);
			}
		);

		this._format = format;

		return format;
	},

	handleFileReadError: function(err) {
		var file = this.path;

		var errMsg = 'Could not open file';

		if (err.code === 'ENOENT') {
			errMsg = 'File does not exist';
		}

		return util.format('%s: %s', errMsg.error, path.resolve(file));
	},

	handleFileWriteError: function(err) {
		var errMsg = 'Could not write to file';

		return util.format('%s: %s', errMsg.error, path.resolve(this.path));
	},

	isDirty: function() {
		return this._contents !== this._origContents;
	},

	read: function() {
		var file = fs.readFileAsync(this.path, 'utf-8').bind(this).then(
			function(data) {
				this._origContents = data;
				this._contents = data;

				return data;
			}
		);

		this._read = file;

		return file;
	},

	write: function() {
		return fs.writeFileAsync(this.path, this._contents).bind(this);
	}
};

module.exports = File;