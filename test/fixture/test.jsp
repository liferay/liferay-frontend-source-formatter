<!DOCTYPE html>
<html>
<head>
	<title>Test Check Source Formatting</title>
</head>
<body>
	<!-- Sort attribute values -->
	<div class="foo bar"></div>
	<aui:nav cssClass="bar abc"></aui:nav>

	<!-- Sort attributes -->
	<div id="foo" class="foo"></div>
	<div id="foo" class="foo <%= bar ? "bar" : "abc" %>"></div>
	<img id="foo" class="foo <%= bar ? "bar" : "abc" %>" />
	<aui:nav id="nav" cssClass="bar abc"></aui:nav>
	<aui:nav id='<%= "nav" %>' cssClass='<%= "bar abc" %>'></aui:nav>

	<!-- Common -->
	<!-- Invalid space -->
	<img src="foo" />
	<!-- Mixed spaces and tabs -->
	 <div class="foo"></div>

	<!-- Script tags -->
	<script type="text">
		var test = true;
	</script>

	<aui:script>
		var test = true;
	</aui:script>

	<aui:script use="aui-base,event,node">
		var test = true

		Liferay.Language.get('foo');

		Liferay.provide(
			window,
			'test',
			function() {
				var foo = false;
			}
		);
	</aui:script>
</body>
</html>