var Logger = require('content-logger');

var contentLogger = Logger.create(
	{
		prototype: {
			init: function() {
				this.testStats = {
					failures: 0
				};

				this.on(
					'add',
					function(error) {
						this.testStats.failures++;
					}
				);
			}
		}
	}
);

module.exports = new contentLogger();