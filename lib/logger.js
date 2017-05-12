var Logger = require('content-logger');

var contentLogger = Logger.create(
	{
		prototype: {
			init() {
				this.testStats = {
					failures: 0
				};

				this._errorStack = [];

				this.on(
					'add',
					function(error) {
						if (error.type !== 'ignored') {
							this.testStats.failures++;
						}
					}
				);
			},

			filterFileErrors(file, fn) {
				var fileErrors;

				var errors = this.getErrors(file);

				this._errorStack.push(errors);

				var filteredErrors = fn(errors);

				filteredErrors.errorMap = {};

				this.fileErrors[file] = filteredErrors;

				return fileErrors;
			}
		}
	}
);

module.exports = new contentLogger();