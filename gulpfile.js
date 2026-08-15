const { src, dest } = require('gulp');

function buildIcons() {
	return src(['nodes/**/*.svg', 'nodes/**/*.png', 'credentials/**/*.svg', 'credentials/**/*.png']).pipe(
		dest('dist/nodes'),
	);
}

exports['build:icons'] = buildIcons;
exports.default = buildIcons;
