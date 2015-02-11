{{#banner}}{{#blackBG}}File:{{/blackBG}} {{#underline}}{{{file}}}{{/underline}}{{/banner}}
{{#errors}}
    {{#color}}{{line}}: {{{msg}}}{{#and @root.showLintIds ruleId}} ({{ruleId}}){{/and}}{{/color}}
{{else}}
    No errors
{{/errors}}
{{#banner}}{{#subtle}}----{{/subtle}}{{/banner}}