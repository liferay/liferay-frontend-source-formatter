var Logger = {
	fileErrors: {},
	testStats: 0,

	log: function(err, file, type) {
		var fileErrors = this.fileErrors;

		var errors = fileErrors[file];

		this.testStats.failures++;

		if (!errors) {
			errors = [];

			fileErrors[file] = errors;
		}

		errors.push(
			{
				err: err,
				type: type
			}
		);
	}
};

module.exports = Logger;