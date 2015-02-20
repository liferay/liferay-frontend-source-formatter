var path = require('path');
var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');

// var index = require(path.join(__dirname, '..', './index.js'));

var File = require('../lib/file');
var Formatter = require('../lib/formatter');
var Logger = require('../lib/logger');

describe('index()', function () {
	'use strict';

	// var testFilePath = path.join(__dirname, 'fixture', 'test.jsp');

	// var obj = new File(testFilePath);

	// it('exists', function () {
	// 	expect(obj).to.be.a('object');
	// });

	// it('has the right path', function () {
	// 	expect(obj.path).to.equal(testFilePath);
	// });

	// it('has contents', function (done) {
	// 	obj.read().then(function(data) {
	// 		expect(data).to.be.a('string');
	// 		done();
	// 	});
	// });
});