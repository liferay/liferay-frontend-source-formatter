var stylelint = require('stylelint');
var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;

function assertEquality(processCss, context) {
	const describeFn = (context.only) ? describe.only : describe;

	describeFn(
		context.caseDescription,
		function() {
			it(
				context.completeAssertionDescription,
				function() {
					return processCss.then(
						function(comparisons) {
							comparisons.forEach(
								function(item, index) {
									var actual = item.actual;
									var expected = item.expected;
									var description = item.description;

									assert.equal(actual, expected, description);
								}
							);
						}
					);
				}
			);
		}
	);
}

module.exports = stylelint.createRuleTester(assertEquality);

module.exports.stylelint = stylelint;