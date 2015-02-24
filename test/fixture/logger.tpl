{{#banner}}File:{{{file}}}{{/banner}}
{{#errors}}
{{line}}:{{{msg}}}
{{#and @root.showLintIds ruleId}}ruleId:{{ruleId}}{{/and~}}
{{else}}
{{#if @root.showBanner}}No errors{{/if}}
{{/errors}}