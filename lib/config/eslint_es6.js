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
		'jsx-curly-spacing': [2, 'never'],
		'jsx-indent': [2, 'tab'],
		'jsx-indent-props': [2, 'tab'],
		'jsx-key': 2,
		'jsx-equals-spacing': [2, 'never'],
		'jsx-no-undef': 2,
		'jsx-no-duplicate-props': 2,
		'jsx-no-literals': 2,
		'jsx-closing-bracket-location': 2,
		'jsx-pascal-case': 2,
		'jsx-space-before-closing': [2, 'always'],
		'jsx-sort-props': [2, {'ignoreCase': true}],
		'no-multi-comp': [2/*, {'ignoreStateless': true}*/],
		'wrap-multilines': [2/*, {'ignoreStateless': true}*/],
		'no-unknown-property': 2,
		'sort-comp': [2, {
			order: [
				'static-methods',
				'lifecycle',
				'everything-else',
				'render'
			],
			groups: {
				lifecycle: [
					'constructor',
					'displayName',
					'mixins',
					'propTypes',
					'statics',
					'defaultProps',
					'getDefaultProps',
					'getInitialState',
					'state',
					'componentWillMount',
					'componentDidMount',
					'componentWillReceiveProps',
					'componentWillUpdate',
					'componentDidUpdate',
					'componentWillUnmount',
					'shouldComponentUpdate',
					'getChildContext',
					'childContextTypes',
					'contextTypes',
				]
			}
		}],

		'arrow-body-style': [0, 'as-needed'],
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