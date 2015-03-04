var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;

var base = require('../lib/base');

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