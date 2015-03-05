var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');

var base = require('../lib/base');

chai.use(require('chai-string'));

var assert = chai.assert;

describe(
	'base',
	function() {
		'use strict';

		var sub = base.sub;

		var sandbox;

		beforeEach(
			function() {
				sandbox = sinon.sandbox.create();
			}
		);

		afterEach(
			function() {
				sandbox.restore();
			}
		);

		it(
			'should substitute strings correctly',
			function() {
				assert.equal('Foo bar', sub('Foo {0}', 'bar'));
				assert.equal('Foo bar', sub('Foo {0}', ['bar']));

				assert.equal(
					'Foo bar',
					sub(
						'Foo {key}',
						{
							key: 'bar'
						}
					)
				);

				assert.equal(1, sub(1, 'bar'));
			}
		);

		it(
			'should bind function arguments correctly',
			function() {
				var obj = {};

				var fn = sandbox.spy();

				var fn2 = sandbox.spy();

				var obj2 = {
					fn: fn2
				};

				var fnRight = _.bindRight(fn, obj, 2, 3);
				var fnKeyRight = _.bindKeyRight(obj2, 'fn', 3, 4);

				assert.isFunction(fnRight);
				assert.isFunction(fnKeyRight);

				fnRight(1);
				fnKeyRight(2);

				assert.isTrue(fn.called, 'fn should have been called');
				assert.isTrue(fn.calledOn(obj), 'fn should have been called with obj as it\'s context');
				assert.isTrue(fn2.called, 'fn2 should have been called');
				assert.isTrue(fn2.calledOn(obj2), 'fn2 should have been called with obj2 as it\'s context');

				assert.deepEqual(fn.args[0], [1, 2, 3], 'arguments to fn should have been 1, 2, 3');
				assert.deepEqual(fn2.args[0], [2, 3, 4], 'arguments to fn2 should have been 2, 3, 4');

				fn2.reset();

				var fn3 = sandbox.spy();

				obj2.fn = fn3;

				fnKeyRight(2);

				assert.isTrue(fn2.notCalled, 'fn2 should not have been called');
				assert.isTrue(fn3.called, 'fn3 should have been called');

				assert.isTrue(fn3.calledOn(obj2), 'fn2 should have been called with obj2 as it\'s context');
				assert.deepEqual(fn3.args[0], [2, 3, 4], 'arguments to fn2 should have been 2, 3, 4');
			}
		);
	}
);