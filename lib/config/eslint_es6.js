module.exports = {
	'env': {
		'es6': true
	},

	'parserOptions': {
		'sourceType': 'module',
		'ecmaFeatures': {
			'experimentalObjectRestSpread': true,
			'jsx': true
		}
	},

	'plugins': [
		'react'
	],

	'rules': {
		'jsx-uses-react': 2,
		'jsx-uses-vars': 2,

		'arrow-body-style': [2, 'as-needed'],
		'arrow-parens': [2, 'as-needed'],
		'object-shorthand': [2, 'always', { 'ignoreConstructors': true }],
		'prefer-arrow-callback': 2,
		'no-new-symbol': 2,
		'prefer-const': 2,
		'prefer-rest-params': 2,
		'prefer-spread': 2,
		'prefer-template': 2
	}
};