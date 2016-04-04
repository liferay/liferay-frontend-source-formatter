module.exports = {
	flags: {
		quiet: true
	},

	'path:**/foo.css': {
		flags: {
			quiet: false
		}
	},

	'path:**/foo.js': {
		flags: {
			quiet: true
		}
	}
};