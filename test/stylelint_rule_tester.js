var stylelint = require('stylelint');
var chai = require('chai');

chai.use(require('chai-string'));

var assert = chai.assert;
var sinon = require('sinon');
function assertEquality(processCss, context) {
	const describeFn = (context.only) ? describe.only : describe;

	sinon.spy(it);

	describeFn(
		context.caseDescription,
		function() {
			it(
				context.completeAssertionDescription,
				function(done) {
					processCss.then(
						function(comparisons) {
							comparisons.forEach(
								function(item, index) {
									var actual = item.actual;
									var expected = item.expected;
									var description = item.description;

									assert.equal(actual, expected, description);
								}
							);

							done();
						}
					).catch(done)
				}
			);

			console.log(it.called);
		}
	);
}

module.exports = stylelint.createRuleTester(assertEquality);

module.exports.stylelint = stylelint;