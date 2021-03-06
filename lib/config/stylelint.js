module.exports = {

	'plugins': [
		'stylelint-order'
	],

	'globals': {

	},

	'rules': {
		// 'at-rule-blacklist': 'string|[]',
		// 'at-rule-empty-line-before': 'alwaysd|never',
		'at-rule-name-case': 'lower',
		// 'at-rule-name-newline-after': 'alwaysd|always-multi-line',
		'at-rule-name-space-after': 'always',
		// 'at-rule-no-unknown': true,
		'at-rule-semicolon-newline-after': 'always',
		'at-rule-semicolon-space-before': 'never',
		// 'at-rule-whitelist': 'string|[]',
		'block-closing-brace-empty-line-before': 'never',
		'comment-no-empty': true,
		// 'comment-word-blacklist': 'string|[]',
		// 'custom-property-empty-line-before': 'alwaysd|never',
		'declaration-block-no-redundant-longhand-properties': true,
		// 'declaration-empty-line-before': 'alwaysd|never',
		// 'declaration-property-unit-blacklist': {},
		// 'declaration-property-unit-whitelist': {},
		// 'declaration-property-value-blacklist': {},
		// 'declaration-property-value-whitelist': {},
		'font-family-no-duplicate-names': true,
		'function-max-empty-lines': 0,
		'function-name-case': 'lower',
		// 'function-url-data-uris': 'alwaysd|never',
		// 'function-url-no-scheme-relative': true,
		// 'function-url-scheme-whitelist': 'string|[]',
		// 'keyframe-declaration-no-important': true,
		// 'media-feature-name-blacklist': 'string|[]',
		'media-feature-name-case': 'lower',
		// 'media-feature-name-no-unknown': true,
		// 'media-feature-name-whitelist': 'string|[]',
		'no-empty-source': false,
		'no-extra-semicolons': true,
		// 'no-missing-end-of-source-newline': true,
		'property-case': 'lower',
		// 'property-no-unknown': true,
		'selector-attribute-brackets-space-inside': 'never',
		// 'selector-attribute-operator-blacklist': 'string|[]',
		'selector-attribute-operator-space-after': 'never',
		'selector-attribute-operator-space-before': 'never',
		// 'selector-attribute-operator-whitelist': 'string|[]',
		// 'selector-attribute-quotes': 'alwaysd|never',
		'selector-descendant-combinator-no-non-space': true,
		'selector-max-empty-lines': 0,
		// 'selector-max-compound-selectors': 'int',
		// 'selector-nested-pattern': 'string',
		// 'selector-no-qualifying-type': true,
		// 'selector-pseudo-class-blacklist': 'string|[]',
		'selector-pseudo-class-case': 'lower',
		'selector-pseudo-class-no-unknown': true,
		'selector-pseudo-class-parentheses-space-inside': 'never',
		// 'selector-pseudo-class-whitelist': 'string|[]',
		'selector-pseudo-element-case': 'lower',
		'selector-pseudo-element-no-unknown': true,
		// 'selector-type-no-unknown': true,
		'shorthand-property-no-redundant-values': true,
		// 'time-min-milliseconds': 'int',
		'unit-case': 'lower',
		'unit-no-unknown': true,
		'value-keyword-case': 'lower',
		'value-list-max-empty-lines': 0,

		'csf/at-rule-empty-line': [
			'always',
			{
				except: ['first-nested']
			}
		],
		'order/properties-alphabetical-order': true,
		'at-rule-no-vendor-prefix': true,
		'block-closing-brace-newline-after': 'always',
		'block-closing-brace-newline-before': 'always',
		// 'block-closing-brace-space-after': 'never',
		// 'block-closing-brace-space-before': 'never',
		// 'block-no-empty': true,
		// 'block-no-single-line': true,
		'block-opening-brace-newline-after': 'always',
		// 'block-opening-brace-newline-before': 'always',
		// 'block-opening-brace-space-after': 'never',
		'block-opening-brace-space-before': 'always',
		'color-hex-case': 'upper',
		'color-hex-length': 'short',
		'color-named': 'never',
		// 'color-no-hex': true,
		'color-no-invalid-hex': true,
		'comment-empty-line-before': [
			'always',
			{
				except: ['first-nested']
			}
		],
		'comment-whitespace-inside': 'always',
		// 'custom-media-pattern': string,
		// 'custom-property-pattern': string,
		'declaration-bang-space-after': 'never',
		'declaration-bang-space-before': 'always',
		'declaration-block-no-duplicate-properties': true,
		'declaration-block-no-shorthand-property-overrides': true,
		'declaration-block-semicolon-newline-after': 'always',
		'declaration-block-semicolon-newline-before': 'never',
		// 'declaration-block-semicolon-space-after': 'always'|'never'|'always-single-line'|'never-single-line',
		'declaration-block-semicolon-space-before': 'never',
		'declaration-block-single-line-max-declarations': 1,
		'declaration-block-trailing-semicolon': 'always',
		// 'declaration-colon-newline-after': 'always'|'always-multi-line',
		'declaration-colon-space-after': 'always',
		'declaration-colon-space-before': 'never',
		// 'declaration-no-important': true,
		'font-family-name-quotes': 'single-where-recommended',
		'font-weight-notation': 'named-where-possible',
		// 'function-blacklist': 'rgba',
		'function-calc-no-unspaced-operator': true,
		'function-comma-newline-after': 'never',
		'function-comma-newline-before': 'never',
		'function-comma-space-after': 'always',
		'function-comma-space-before': 'never',
		// 'function-linear-gradient-no-nonstandard-direction': true,
		// 'function-parentheses-newline-inside': 'always'|'always-multi-line'|'never-multi-line',
		'function-parentheses-space-inside': 'never',

		// Will probably need to reimplement this one to ignore strings with quotes
		// 'function-url-quotes': 'never',

		// 'function-whitelist': '',
		'function-whitespace-after': 'always',
		'indentation': 'tab',
		'max-empty-lines': 1,
		// 'max-line-length': int,
		// 'max-nesting-depth': int,
		'media-feature-colon-space-after': 'always',
		'media-feature-colon-space-before': 'never',
		// 'media-feature-name-no-vendor-prefix': true,
		// 'media-feature-no-missing-punctuation': true,
		'media-feature-range-operator-space-after': 'always',
		'media-feature-range-operator-space-before': 'always',
		// 'media-query-list-comma-newline-after': 'always'|'always-multi-line'|'never-multi-line',
		// 'media-query-list-comma-newline-before': 'always'|'always-multi-line'|'never-multi-line',
		// 'media-query-list-comma-space-after': 'always'|'never'|'always-single-line'|'never-single-line',
		// 'media-query-list-comma-space-before': 'always'|'never'|'always-single-line'|'never-single-line',
		'media-feature-parentheses-space-inside': 'never',
		// 'no-descending-specificity': true, // Maybe
		// 'no-duplicate-selectors': true, // Maybe
		'no-eol-whitespace': true,
		// 'no-invalid-double-slash-comments': true,
		// 'no-missing-end-of-source-newline': true,
		// 'no-unknown-animations': true,
		'number-leading-zero': 'always',
		'number-max-precision': 3,
		'number-no-trailing-zeros': true,
		'length-zero-no-unit': true,
		// 'property-blacklist': string|[],
		'property-no-vendor-prefix': true,
		// 'property-unit-blacklist': {},
		// 'property-unit-whitelist': {},
		// 'property-value-blacklist': {},
		// 'property-whitelist': string|[],
		// 'root-no-standard-properties': true,
		'rule-empty-line-before': [
			'always',
			{
				except: ['first-nested']
			}
		],
		// 'rule-non-nested-empty-line-before': 'always',
		'selector-class-pattern': [
			/(#\{\$.*?\}|[a-z0-9]+)(-#\{\$.*?\}|-[a-z0-9]+)*$/,
			{
				resolveNestedSelectors: true
			}
		], // Maybe
		'selector-combinator-space-after': 'always',
		'selector-combinator-space-before': 'always',
		// 'selector-id-pattern': string,
		'selector-list-comma-newline-after': 'always-multi-line', // Maybe
		'selector-list-comma-newline-before': 'never-multi-line',
		'selector-list-comma-space-after': 'always-single-line',
		'selector-list-comma-space-before': 'never',
		// 'selector-max-specificity': string,
		// 'selector-no-attribute': true,
		// 'selector-no-combinator': true,
		// 'selector-no-id': true,
		// 'selector-no-type': true,
		// 'selector-no-universal': true,
		// 'selector-no-vendor-prefix': true,
		'selector-pseudo-element-colon-notation': 'single',
		'selector-type-case': 'lower',
		'string-no-newline': true,
		// 'string-quotes': 'single',
		// 'time-no-imperceptible': true,
		// 'unit-blacklist': string|[],
		// 'unit-whitelist': string|[],
		'value-list-comma-newline-after': false,
		'value-list-comma-newline-before': 'never-multi-line',
		'value-list-comma-space-after': 'always-single-line',
		'value-list-comma-space-before': 'never'
		// 'value-no-vendor-prefix': true
	}
};