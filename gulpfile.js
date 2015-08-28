var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

gulp.task('coveralls', function () {
	gulp.src('coverage/**/lcov.info')
		.pipe(plugins.coveralls());
});

gulp.task('test', function(done) {
	return runSequence('test-unit', done);
});

gulp.task('test-complexity', function() {
	return gulp.src(['lib/**/*.js'])
		.pipe(plugins.complexity({
			cyclomatic: [4, 7, 12],
			halstead: [15, 15, 20]
		}));
});

gulp.task('test-unit', function() {
	process.argv.push('--display-raw');

	return gulp.src(['test/**/*.js', '!test/fixture/*.js'])
		.pipe(plugins.mocha());
});

gulp.task('test-cover', function() {
	return gulp.src(['lib/**/*.js'])
		.pipe(plugins.istanbul())
		.pipe(plugins.istanbul.hookRequire());
});

gulp.task('test-coverage', ['test-cover'], function() {
	process.argv.push('--display-raw');

	return gulp.src(['test/**/*.js', '!test/fixture/*.js'])
		.pipe(plugins.mocha())
		.pipe(plugins.istanbul.writeReports());
});

gulp.task('toc', function(done) {
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