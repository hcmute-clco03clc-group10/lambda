const path = require('path');
const { readdirSync, statSync } = require('fs');

function readRecursively(src) {
	const files = [];
	const dirs = [src];
	while (dirs.length) {
		const shifted = dirs.shift();
		if (path.basename(shifted) === 'shared') {
			continue;
		}
		for (const i of readdirSync(shifted)) {
			const resolved = path.resolve(shifted, i);
			const stats = statSync(resolved);
			if (stats.isDirectory()) {
				dirs.push(resolved);
			} else if (resolved.endsWith('.ts')) {
				files.push(resolved);
			}
		}
	}
	return files;
}

require('esbuild').build({
	target: 'es2020',
	format: 'cjs',
	bundle: true,
	tsconfig: 'tsconfig.json',
	sourcemap: 'inline',
	outdir: 'dist',
	platform: 'node',
	watch: process.argv.includes('--watch'),
	entryPoints: readRecursively(path.resolve(__dirname, 'src'))
}).then(e => {
	console.log('build result:', e);
});
