var _ = require('lodash');

function nl() {
	return _.toArray(arguments).join('\n');
}

exports.nl = nl;