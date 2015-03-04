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
	<span><liferay-ui:message key="count" /> <liferay-ui:message key="used-in-x-assets" arguments="<%= tag.getAssetCount() %>" /></span>

	<!-- Common -->
	<!-- Invalid space -->
	<img src="foo" />
	<!-- Mixed spaces and tabs -->
	 <div class="foo"></div>

	<!-- Script tags -->
	<script type="text">
		var testVar = true;
	</script>

	<aui:script>
		var testVar = true;
	</aui:script>

	<aui:script use="aui-base,event,node">
		var testVar = true

		Liferay.Language.get('foo');

		Liferay.provide(
			window,
			'testFn',
			function() {
				var foo = false;
			}
		);
	</aui:script>

	<aui:script>
		<%
		List<String> foo = null;
		%>

		foo();
	</aui:script>

	<aui:script use="event"></aui:script>
</body>
</html>