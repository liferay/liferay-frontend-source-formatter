module.exports = function(context) {

    return {
        'IfStatement': function(node) {
            var ancestors = context.getAncestors(),
                parent = ancestors.pop(),
                grandparent = ancestors.pop();

            if (parent && parent.type === 'BlockStatement' &&
                    parent.body.length === 1 && grandparent &&
                    grandparent.type === 'IfStatement'/* &&
                    parent === grandparent.alternate*/) {

                var blockType = parent === grandparent.alternate ? 'else' : 'if';

                context.report(node, 'Unexpected if as the only statement in an ' + blockType + ' block.');
            }
        }
    };
};