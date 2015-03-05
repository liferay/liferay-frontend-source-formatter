module.exports = function(context) {

    return {
        'IfStatement': function(node) {
            var ancestors = context.getAncestors(),
                parent = ancestors.pop(),
                grandparent = ancestors.pop();

            if (!node.alternate && parent && parent.type === 'BlockStatement' &&
                    parent.body.length === 1 && grandparent &&
                    grandparent.type === 'IfStatement') {

                var blockType = parent === grandparent.alternate ? 'else' : 'if';

                context.report(node, 'Unexpected if as the only statement in an ' + blockType + ' block.');
            }
        }
    };
};