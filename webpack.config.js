const path = require('path');

// TODO: add shebang line to output
// TODO: set executable bit on output
//
// TODO: sort out "importLazy" calls in "update-notifier" package (hidden
// requires) -- https://github.com/yeoman/update-notifier/issues/123
// sadly, stylelint also uses import-lazy and dynamic imports
// so need to transform those to not use it...
//
// TODO: sort out "module" being treated as an external
// compiles to module.exports = module

module.exports = {
	entry: './bin/index.js',
	externals: [
		'child_process',
		'fs',
		'module',
	],
	mode: 'production',
	module: {
		rules: [
			{
				// Don't choke on the shebang at the start of bin/index.js.
				include: [
					path.resolve(__dirname, 'bin')
				],
				test: /\.js$/,
				use: ['shebang-loader']
			}
		]
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'csf'
	},
	resolve: {
		alias: {
			// For dependencies that require these "-cov" variants depending on
			// an environment variable that we'll never set, and which webpack
			// wouldn't be able to find anyway.
			'./lib-cov/concat': './lib/concat',
			'./lib-cov/drip': './lib/drip',
		}
	}
};
