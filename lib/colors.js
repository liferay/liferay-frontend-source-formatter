var _ = require('lodash');

var chalk = require('chalk');

var ctx = new chalk.constructor();

_.defaults(ctx, chalk);

ctx.bgError = ctx.bgRed;
ctx.bgHelp = ctx.bgCyan;
ctx.bgSubtle = ctx.bgGrey;
ctx.bgWarn = ctx.bgYellow;
ctx.error = ctx.red;
ctx.help = ctx.cyan;
ctx.subtle = ctx.grey;
ctx.warn = ctx.yellow;

module.exports = ctx;