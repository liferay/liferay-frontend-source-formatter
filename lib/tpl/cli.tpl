{{#banner}}{{#bgBlack}}File:{{/bgBlack}} {{#underline}}{{{file}}}{{/underline}}{{/banner}}
{{#errors}}
    {{#color}}{{line}}: {{{msg}}}{{#and @root.showLintIds ruleId}} ({{ruleId}}){{/and}}{{/color}}
{{else}}
    {{#if @root.showBanner}}
    	No errors
    {{/if}}
{{/errors}}
{{#banner}}{{#subtle}}----{{/subtle}}{{/banner}}