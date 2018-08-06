require('harmonize')();

var _ = require('lodash');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var inquirer = require('inquirer');

gulp.task('coveralls', () => {
	gulp.src('coverage/**/lcov.info')
		.pipe(plugins.coveralls());
});

gulp.task('test', done => runSequence('test-unit', done));

gulp.task('test-complexity', () => gulp.src(['lib/**/*.js'])
	.pipe(plugins.complexity({
		cyclomatic: [4, 7, 12],
		halstead: [15, 15, 20]
	})));

gulp.task('test-file', () => {
	var file = process.argv.slice(3).pop();

	if (file) {
		file = file.slice(2);
		file = !_.startsWith(file, 'test/') ? `test/${file}` : file;
		file = !_.endsWith(file, '.js') ? `${file}.js` : file;

		file = [file];
	}
	else {
		file = ['test/**/*.js', '!test/fixture/*.js'];
	}

	return gulp.src(file)
		// .pipe(plugins.debug())
		.pipe(plugins.mocha(
				{
					'display-raw': true
				}
			)
		);
});

gulp.task('test-unit', () => {
	return gulp.src(['test/**/*.js', '!test/fixture/*.js'])
		.pipe(plugins.mocha(
				{
					'display-raw': true
				}
			)
		);
});

gulp.task('test-cover', () => gulp.src(['lib/**/*.js'])
	.pipe(plugins.istanbul())
	.pipe(plugins.istanbul.hookRequire()));

gulp.task('test-coverage', ['test-cover'], () => {
	return gulp.src(['test/**/*.js', '!test/fixture/*.js'])
		.pipe(plugins.mocha(
				{
					'display-raw': true
				}
			)
		)
		.pipe(plugins.istanbul.writeReports());
});

gulp.task('toc', done => {
	gulp.src('./README.md')
	.pipe(
		plugins.doctoc(
			{
				title: '### Jump to Section',
				depth: 2
			}
		)
	)
	.pipe(gulp.dest('./'));
});

gulp.task(
	'new-rule',
	done => {
		inquirer.prompt(
			[
				{
					type: 'list',
					choices: ['ESLint'/*, 'Stylelint'*/],
					message: 'What kind of linting rule do you wish to create?',
					name: 'type'
				},
				{
					type: 'input',
					default: 'my-new-rule',
					filter: _.snakeCase,
					message: 'What do you want to name it?',
					name: 'name'
				},
				{
					type: 'input',
					default: 'Checks for this issue.',
					message: 'Type a short description',
					name: 'description'
				}
			]
		)
		.then(
			res => {
				var srcDir = 'js';
				var destDir = 'lint_js_rules';

				if (res.type !== 'ESLint') {
					srcDir = 'css';
					destDir = 'lint_css_rules';
				}

				gulp.src(`./lib/tpl/lint_rules/${srcDir}/*.js`)
				// .pipe(plugins.debug())
				.pipe(
					plugins.rename(
						path => {
							var baseDir = path.basename === 'rule' ? 'lib' : 'test';

							path.dirname = `./${baseDir}/lint_${srcDir}_rules`;

							path.basename = res.name;
						}
					)
				)
				.pipe(
					plugins.template(
						res,
						{
							interpolate: /<%=([\s\S]+?)%>/g
						}
					)
				)
				.pipe(gulp.dest('./'));

				done();
			}
		);
	}
);