const path = require('path');
const { readdirSync, statSync } = require('fs');

function readRecursively(src) {
	const files = [];
	const dirs = [src];
	while (dirs.length) {
		const shifted = dirs.shift();
		for (const i of readdirSync(shifted)) {
			const p = path.resolve(shifted, i);
			const stats = statSync(p);
			if (stats.isDirectory()) {
				dirs.push(p);
			} else if (p.endsWith('.ts')) {
				files.push(p);
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
