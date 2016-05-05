var path = require('path');
var sub = require('string-sub');

var lint = require('../../lib/lint_js');

var linter = lint.linter;
var RuleTester = lint.eslint.RuleTester;

var ruleTester = new RuleTester();

var addES6 = require('../test_utils').addES6();

ruleTester.run(
	path.basename(__filename, '.js'),
	require('../../lib/lint_js_rules/' + path.basename(__filename)),
	{
		valid: [
			'var FOO1;',
			'var FOO1 = \'\';',
			'var FOO1 = \'something\' +\n\t\'else\';',
			'var FOO1 = \'something\' +\n\tLiferay.foo();',
			'var FOO1 = \'something\' +\n\tLiferay.foo() + \'foo\';',
			'FOO1 = \'\';',
			'FOO1 = \'something\' +\n\'else\';',
			'FOO1 = \'something\' +\nLiferay.foo();',
			'FOO1 = \'something\' +\nLiferay.foo() + \'foo\';',
			'FOO1 = (\nbar && baz\n);'
		].concat(
			[
				{code: 'var {\nFOO1,\nFOO2\n} = {FOO1: 1, FOO2: 2};'},
				{code: 'var [\nFOO1,\nFOO2\n] = [1, 2];'},
			].map(addES6)
		),

		invalid: [
			{
				code: 'var FOO1 = \'something\' +\n\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 = \'something\' +\n\t\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 = \'something\' +\n\t\tLiferay.foo();',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\t\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'var FOO1 =\n\'something\';',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\t\'else\';',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 = \'something\' +\n\t\tLiferay.foo();',
				errors: [ { message: 'Multi-line strings should be aligned to the start of the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n\'something\' +\nLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: '\tFOO1 =\n\t\'something\' +\n\tLiferay.foo();',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n\'something\';',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			},
			{
				code: 'FOO1 =\n(\nbar && baz\n);',
				errors: [ { message: 'Variable values should start on the same line as the variable name "FOO1"' } ]
			}
		].concat(
			[
				{
					code: 'var\n{\nFOO1,\nFOO2\n}\n= {FOO1: 1, FOO2: 2};',
					errors: [{ message: sub('Destructured assignments should have "{startToken}" on the same line as "{keywordToken}" and "{endToken}" should be on the same line as "{initName}"', {startToken: '{', keywordToken: 'var', endToken: '}', initName: '{FOO1: 1, FOO2: 2}'}) }]
				},
				{
					code: 'var\n[\nFOO1,\nFOO2\n]\n= [1, 2];',
					errors: [{ message: sub('Destructured assignments should have "{startToken}" on the same line as "{keywordToken}" and "{endToken}" should be on the same line as "{initName}"', {startToken: '[', keywordToken: 'var', endToken: ']', initName: '[1, 2]'}) }]
				},
				{
					code: 'var\n{\nFOO1,\nFOO2\n}\n= FOO;',
					errors: [{ message: sub('Destructured assignments should have "{startToken}" on the same line as "{keywordToken}" and "{endToken}" should be on the same line as "{initName}"', {startToken: '{', keywordToken: 'var', endToken: '}', initName: 'FOO'}) }]
				},
				{
					code: 'var\n[\nFOO1,\nFOO2\n]\n= FOO;',
					errors: [{ message: sub('Destructured assignments should have "{startToken}" on the same line as "{keywordToken}" and "{endToken}" should be on the same line as "{initName}"', {startToken: '[', keywordToken: 'var', endToken: ']', initName: 'FOO'}) }]
				},
				{
					code: 'var\n{\nFOO1,\nFOO2\n} = FOO;',
					errors: [{ message: 'Destructured assignments should have "{" on the same line as "var"' }]
				},
				{
					code: 'var {\nFOO1,\nFOO2\n}\n= FOO;',
					errors: [{ message: 'Destructured assignments should have "}" on the same line as "FOO"' }]
				},
			].map(addES6)
		)
	}
);