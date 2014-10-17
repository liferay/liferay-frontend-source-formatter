<?xml encoding="UTF-8" version="1.0" ?>
<testsuites failures="{{stats.failures}}" name="">
	{{#files}}
		<testsuite failures="{{stats.failures}}" name="{{file}}">
			{{#errors}}
				<testcase name="{{testName}}">
					{{#failure}}
						<failure message="{{violationType}}" type="failure">{{stack}}</failure>
					{{/failure}}
				</testcase>
			{{/errors}}
		</testsuite>
	{{/files}}
</testsuites>