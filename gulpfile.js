const { src, dest } = require('gulp');

function buildIcons() {
	return src(['nodes/**/*.svg', 'nodes/**/*.png', 'credentials/**/*.svg', 'credentials/**/*.png'], { base: '.' }).pipe(
		dest('dist'),
	);
}

exports['build:icons'] = buildIcons;
exports.default = buildIcons;
