var _ = require('lodash');
var chai = require('chai');
var falafel = require('falafel');
var sinon = require('sinon');

var ruleUtils = require('../lib/rule_utils');

chai.use(require('chai-string'));

var assert = chai.assert;

var parse = function(contents, cb) {
	return falafel(
		contents,
		{
			loc: true,
			tolerant: true
		},
		cb
	);
};

describe(
	'Rule Utils',
	function() {
		'use strict';

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
			'should get constants from node properly',
			function(done) {

				parse(
					'var regVar = 1; var X = "X_FOO"; var Y = "Y_FOO"; var ZnotConstant = "NOT_CONSTANT"',
					function(node) {
						if (node.type === 'Program') {
							var constants = ruleUtils.getConstants(node);
							var constantNames = _.pluck(_.pluck(constants, 'id'), 'name');

							assert.equal(constants.length, 2);
							assert.equal(constantNames.join(''), 'XY');

							done();
						}
					}
				);
			}
		);

		it(
			'should calculate line distance',
			function(done) {

				var varStr = ['var a = 1;', 'var b = 2;', 'var c = 3;', 'var d = 4;'].join('\n');

				parse(
					varStr,
					function(node) {
						if (node.type === 'Program') {
							var variables = _.where(
								node.body,
								{
									type: 'VariableDeclaration'
								}
							);

							var lastIndex = variables.length - 1;

							assert.equal(ruleUtils.getLineDistance(variables[0], variables[lastIndex]), lastIndex);

							done();
						}
					}
				);
			}
		);

		it(
			'should sort array naturally',
			function() {
				var naturalCompare = ruleUtils.naturalCompare;

				assert.equal(naturalCompare('a', 'a', false), 0, 'a should be the same as a');
				assert.equal(naturalCompare('a', 'A', false), 1, 'a should come before A');
				assert.equal(naturalCompare('A', 'a', false), -1, 'A should not come before a');
				assert.equal(naturalCompare('a', 'b', false), -1, 'a should come before b');
				assert.equal(naturalCompare('iStragedy', 'isTragedy', false), -1, 'iStragedy should come before isTragedy');

				assert.equal(naturalCompare(1, 1), 0, '1 should be the same as 1');
				assert.equal(naturalCompare(1, 2), -1, '1 should come before 2');
				assert.equal(naturalCompare(2, 1), 1, '2 should not come before 1');
				assert.equal(naturalCompare('1', '1'), 0, '"1" should be the same as "1"');
				assert.equal(naturalCompare('1', '2'), -1, '"1" should come before "2"');
				assert.equal(naturalCompare('2', '1'), 1, '"2" should not come before "1"');

				assert.equal(naturalCompare('a', 'a', true), 0, 'a should be the same as a');
				assert.equal(naturalCompare('a', 'A', true), 0, 'a should be the same as A');
				assert.equal(naturalCompare('A', 'a', true), 0, 'A should be the same as a');
				assert.equal(naturalCompare('a', 'b', true), -1, 'a should come before b');
				assert.equal(naturalCompare('iStragedy', 'isTragedy', true), 0, 'iStragedy should be the same as isTragedy');
			}
		);
	}
);