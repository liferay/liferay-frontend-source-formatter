module.exports = {
	liferayLanguage: {
		message: 'Do not use Liferay.Language.get() outside of .js files: {1}',
		regex: /Liferay\.Language\.get/
	},
	liferayProvide: {
		message: 'You can\'t have a Liferay.provide call in a script taglib that has a "use" attribute',
		regex: /Liferay\.provide/,
		test: function(content, regex, rule, context) {
			return context.asyncAUIScript && this.test(content, regex);
		}
	}
};