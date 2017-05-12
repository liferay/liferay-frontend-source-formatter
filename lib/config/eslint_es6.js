module.exports = {
	'plugins': [
		'react'
	],

	'rules': {
		'jsx-quotes': [2, 'prefer-double'],
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
		'jsx-tag-spacing': [2],
		'jsx-sort-props': [
			2,
			{
				'ignoreCase': true
			}
		],
		'no-multi-comp': [
			0,
			{
				'ignoreStateless': true
			}
		],
		'jsx-wrap-multilines': [2/* , {'ignoreStateless': true} */],
		'no-unknown-property': 2,
		'sort-comp': [
			0,
			{
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
						'contextTypes'
					]
				},
				order: [
					'static-methods',
					'lifecycle',
					'everything-else',
					'render'
				]
			}
		],
		'prop-types': 0,
		'display-name': 0,
		'no-danger': 0,
		'no-set-state': 0,
		'no-is-mounted': 0,
		'no-deprecated': 0,
		'no-did-mount-set-state': 0,
		'no-did-update-set-state': 0,
		'react-in-jsx-scope': 0,
		'jsx-handler-names': 0,
		'jsx-boolean-value': 0,
		'require-extension': 0,
		'jsx-max-props-per-line': 0,
		'no-string-refs': 0,
		'prefer-stateless-function': 0,

		'require-render-return': 2,
		'jsx-first-prop-new-line': [2, 'multiline'],
		'self-closing-comp': 2,
		'sort-prop-types': [
			2,
			{
				'ignoreCase': true
			}
		],
		'no-direct-mutation-state': 2,

		'forbid-prop-types': 0,
		'jsx-no-bind': 2,
		'prefer-es6-class': 0,

		'arrow-body-style': [0, 'as-needed'],
		'arrow-parens': [2, 'as-needed'],
		'object-property-newline': 0,
		'object-shorthand': [
			2,
			'always',
			{
				'ignoreConstructors': true
			}
		],
		'prefer-arrow-callback': [
			2,
			{
				'allowNamedFunctions': true
			}
		],
		'no-new-symbol': 2,
		'prefer-const': 2,
		'prefer-rest-params': 2,
		'prefer-spread': 2,
		'prefer-template': 2
	}
};