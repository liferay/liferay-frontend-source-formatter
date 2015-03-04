var chai = require('chai');

var base = require('../lib/base');

chai.use(require('chai-string'));

var assert = chai.assert;


describe(
	'base',
	function () {
		'use strict';

		var sub = base.sub;

		it(
			'should substitute strings correctly',
			function() {
				assert.equal('Foo bar', sub('Foo {0}', 'bar'));
				assert.equal('Foo bar', sub('Foo {0}', ['bar']));
				assert.equal('Foo bar', sub('Foo {key}', {key: 'bar'}));
				assert.equal(1, sub(1, 'bar'));
			}
		);
	}
);