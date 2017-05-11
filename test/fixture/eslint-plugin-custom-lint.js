module.exports = {
	rules: {
		foo: function(context) {
			return {
				'Program:exit': function() {
				}
			};
		}
	}
};