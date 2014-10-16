<?xml version="1.0" encoding="UTF-8" ?>
<testsuites name="" failures="{{stats.failures}}">
	{{#files}}
		<testsuite name="{{file}}" failures="{{stats.failures}}">
			{{#errors}}
				<testcase name="{{testName}}">
					{{#failure}}
						<failure type="failure" message="{{violationType}}">{{stack}}</failure>
					{{/failure}}
				</testcase>
			{{/errors}}
		</testsuite>
	{{/files}}
</testsuites>