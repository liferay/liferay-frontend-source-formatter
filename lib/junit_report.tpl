<?xml version="1.0" encoding="UTF-8" ?>
<testsuites failures="{{stats.failures}}" name="">
	{{#files}}
		<testsuite failures="{{stats.failures}}" name="{{file}}" tests="1">
			{{#errors}}
				<testcase name="{{testName}}">
					{{#failure}}
						<failure message="{{violationType}}" type="failure"><![CDATA[
							{{~#stack~}}
								{{line}}: {{{msg}}}{{#and @root.showLintIds ruleId}} ({{ruleId}}){{/and}}{{#unless @last}}
{{/unless}}
							{{~/stack~}}
						]]></failure>
					{{/failure}}
				</testcase>
			{{/errors}}
		</testsuite>
	{{/files}}
</testsuites>