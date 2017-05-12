module.exports = {
	'env': {
		'amd': false,
		'browser': true,
		'es6': true,
		'mocha': true,
		'node': true
	},

	'parser': 'babel-eslint',

	'parserOptions': {
		'ecmaFeatures': {
			'experimentalObjectRestSpread': true,
			'jsx': true
		},
		'ecmaVersion': 7,
		'sourceType': 'module'
	},

	'globals': {
		'alert': true,
		'AUI': true,
		'CKEDITOR': true,
		'confirm': true,
		'Liferay': true,
		'submitForm': true,
		'themeDisplay': true,
		'tinyMCE': true,
		'YUI': true
	},

	'rules': {
		'array-bracket-spacing': [2, 'never'],
		'block-scoped-var': 2,
		'brace-style': [2, 'stroustrup'],
		'camelcase': 0,
		'comma-dangle': [2, 'never'],
		'comma-spacing': 2,
		'comma-style': [2, 'last'],
		'complexity': [0, 11],
		'consistent-return': 2,
		'consistent-this': [1, 'instance'],

		// 'csf-no-lonely-if': 2,

		'csf-array-spacing': 2,
		'csf-array-spacing-chars': 2,
		'csf-catch-arg-name': 2,
		'csf-catch-format': 2,
		'csf-format-args': 2,
		'csf-format-constants': 2,

		'csf-function-spacing': 2,
		'csf-format-multiline-vars': 2,
		'csf-liferay-language-get': 2,
		'csf-liferay-provide-format': 2,
		'csf-multiple-vars': 2,
		'csf-no-extra-semi': 2,
		'csf-no-is-prefix': 2,
		'csf-no-multiple-return': 2,
		'csf-no-unused-vars': 2,
		'csf-no-use-before-define': [
			2,
			{
				'classes': true,
				'functions': true,
				'samescope': true
			}
		],
		'csf-sort-constants': 2,
		'csf-sort-props': 2,
		'csf-sort-requires': 2,
		'csf-sort-vars': 2,
		'curly': [2, 'all'],
		'default-case': 0,
		'dot-location': [2, 'property'],
		'dot-notation': 2,
		'eol-last': 0,
		'eqeqeq': 0,
		'func-names': 0,
		'func-style': [0, 'declaration'],
		'generator-star-spacing': 0,
		'guard-for-in': 0,
		'handle-callback-err': 0,
		'indent': [2, 'tab'],
		'key-spacing': 2,
		'keyword-spacing': [
			2,
			{
				after: true,
				before: true
			}
		],
		'max-depth': [0, 4],
		'max-len': [0, 80, 4],
		'max-nested-callbacks': [0, 2],
		'max-params': [0, 3],
		'max-statements': [0, 10],
		'new-cap': 0,
		'new-parens': 2,
		'newline-after-var': 0,
		'no-alert': 0,
		'no-array-constructor': 2,
		'no-bitwise': 0,
		'no-caller': 2,
		'no-catch-shadow': 2,
		'no-cond-assign': 2,
		'no-console': 2,
		'no-constant-condition': 2,
		'no-control-regex': 2,
		'no-debugger': 2,
		'no-delete-var': 2,
		'no-div-regex': 0,
		'no-dupe-args': 2,
		'no-dupe-keys': 2,
		'no-duplicate-case': 2,
		'no-else-return': 2,
		'no-empty': 0,
		'no-empty-character-class': 2,
		'no-eq-null': 0,
		'no-eval': 2,
		'no-ex-assign': 2,
		'no-extend-native': 2,
		'no-extra-bind': 2,
		'no-extra-boolean-cast': 2,
		'no-extra-parens': 0,
		'no-extra-semi': 0,
		'no-fallthrough': 2,
		'no-floating-decimal': 0,
		'no-func-assign': 2,
		'no-implied-eval': 2,
		'no-inline-comments': 2,
		'no-inner-declarations': [2, 'functions'],
		'no-invalid-regexp': 2,
		'no-irregular-whitespace': 2,
		'no-iterator': 2,
		'no-label-var': 2,
		'no-labels': 2,
		'no-lone-blocks': 2,
		'no-lonely-if': 2,
		'no-loop-func': 2,
		'no-mixed-requires': [0, false],
		'no-mixed-spaces-and-tabs': [0, false],
		'no-multi-spaces': 2,
		'no-multi-str': 2,
		'no-multiple-empty-lines': [
			2,
			{
				max: 2
			}
		],
		'no-native-reassign': 2,
		'no-negated-in-lhs': 2,
		'no-nested-ternary': 2,
		'no-new': 0,
		'no-new-func': 2,
		'no-new-object': 2,
		'no-new-require': 0,
		'no-new-wrappers': 2,
		'no-obj-calls': 2,
		'no-octal': 2,
		'no-octal-escape': 2,
		'no-param-reassign': 0,
		'no-path-concat': 0,
		'no-plusplus': 0,
		'no-process-env': 0,
		'no-process-exit': 2,
		'no-proto': 2,
		'no-redeclare': 2,
		'no-regex-spaces': 2,
		'no-restricted-modules': 0,
		'no-return-assign': 2,
		'no-script-url': 0,
		'no-self-compare': 0,
		'no-sequences': 2,
		'no-shadow': 0,
		'no-shadow-restricted-names': 2,
		'no-spaced-func': 2,
		'no-sparse-arrays': 2,
		'no-sync': 0,
		'no-ternary': 0,
		'no-throw-literal': 0,
		'no-trailing-spaces': 2,
		'no-undef': 2,
		'no-undef-init': 2,
		'no-undefined': 0,
		'no-underscore-dangle': 0,
		'no-unreachable': 2,
		'no-unused-expressions': 2,
		'no-unused-vars': [
			2,
			{
				'args': 'none',
				'vars': 'local'
			}
		],
		'no-use-before-define': [0],
		'no-var': 0,
		'no-void': 0,
		'no-warning-comments': [
			0,
			{
				'location': 'start',
				'terms': ['todo', 'fixme', 'xxx']
			}
		],
		'no-with': 2,

		// 'no-extra-parens': 2,

		'one-var': 0,
		'operator-assignment': [2, 'always'],
		'padded-blocks': 0,
		'quote-props': 0,
		'quotes': [2, 'single'],
		'radix': 2,
		'semi': [2, 'always'],
		'semi-spacing': [
			2,
			{
				after: true,
				before: false
			}
		],
		'sort-vars': [
			2,
			{
				ignoreCase: true
			}
		],
		'space-before-blocks': [2, 'always'],
		'space-before-function-paren': [2, 'never'],
		'space-in-parens': [2, 'never'],
		'space-infix-ops': 2,
		'space-unary-ops': [
			1,
			{
				'nonwords': false,
				'words': true
			}
		],
		'spaced-comment': [2, 'always'],
		'template-curly-spacing': [2, 'never'],
		'no-self-assign': 2,
		'strict': 0,
		'use-isnan': 2,
		'valid-jsdoc': 0,
		'valid-typeof': 2,
		'vars-on-top': 0,
		'wrap-iife': 0,
		'wrap-regex': 0,
		'yoda': 2,

		// Investigate

		'jsx-quotes': 0,
		'no-continue': 0,
		'no-invalid-this': 0,
		'no-magic-numbers': 0,
		'no-implicit-globals': 0,
		'no-negated-condition': 0,
		'no-restricted-syntax': 0,

		'accessor-pairs': 0,
		'array-callback-return': 2,
		'arrow-spacing': [
			2,
			{
				after: true,
				before: true
			}
		],
		'block-spacing': 0,
		'callback-return': 0,
		'computed-property-spacing': [2, 'never'],
		'constructor-super': 2,
		'global-require': 2,
		'id-blacklist': 0,
		'id-length': 0,
		'id-match': 0,
		'init-declarations': 0,
		'linebreak-style': [2, 'unix'],
		'lines-around-comment': [
			2,
			{
				'afterBlockComment': true,
				'afterLineComment': true,
				'beforeBlockComment': true,
				'beforeLineComment': true
			}
		],
		'newline-per-chained-call': 0,
		'no-case-declarations': 2,
		'no-class-assign': 2,
		'no-confusing-arrow': 2,
		'no-const-assign': 2,
		'no-dupe-class-members': 2,
		'no-empty-function': 0,
		'no-empty-pattern': 2,
		'no-extra-label': 2,
		'no-implicit-coercion': [
			2,
			{
				allow: ['!!', '*', '+']
			}
		],
		'no-restricted-imports': 0,
		'no-this-before-super': 2,
		'no-unexpected-multiline': 2,
		'no-unmodified-loop-condition': 2,
		'no-unneeded-ternary': 2,
		'no-unused-labels': 0,
		'no-useless-call': 2,
		'no-useless-concat': 2,
		'no-useless-constructor': 2,
		'no-whitespace-before-property': 2,
		'object-curly-spacing': [2, 'never'],
		'object-property-newline': 2,
		'one-var-declaration-per-line': 0,
		'operator-linebreak': [2, 'after'],
		'prefer-reflect': 0,
		'require-jsdoc': 0,
		'require-yield': 0,
		'sort-imports': [
			0,
			{
				ignoreCase: true,
				memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple']
			}
		],
		'yield-star-spacing': 0
	}
};