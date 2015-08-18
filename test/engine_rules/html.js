var chai = require('chai');
var _ = require('lodash');

chai.use(require('chai-string'));

var re = require('../../lib/re');
var sub = require('string-sub');

var assert = chai.assert;

describe(
	'HTML Rule Engine Tests',
	function() {
		'use strict';

		it(
			'should detect anonymous block containers',
			function() {
				var rule = re.rules.html.anonymousBlockContainers;

				var tests = ['<div>', '<div>foo</div>', '<div ></div>'];

				_.forEach(
					tests,
					function(item, index) {
						var context = {
							item: item
						};

						var result = re.testLine(rule, item, context);
						var lineNum = 1;

						assert.isTrue(result, sub('Expected {0} to match', item));
						assert.startsWith(re.getMessage(lineNum, item, result, rule, context), rule.message.split(':')[0]);
					}
				);
			}
		);
	}
);