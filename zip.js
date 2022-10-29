const path = require('path');
const { readdirSync, statSync } = require('fs');
const { spawn } = require('node:child_process');
const { execSync } = require('node:child_process');

function globDirs(src) {
	const dirs = [];
	for (const i of readdirSync(src)) {
		const p = path.resolve(src, i);
		const stats = statSync(p);
		if (stats.isDirectory()) {
			dirs.push(p);
		}
	}
	return dirs;
}

const dist = path.resolve(__dirname, 'dist');
for(const dir of globDirs(dist)) {
	execSync(`cd ${dist} && 7z a -tzip ${path.basename(dir)}.zip ${dir}/*`, {
		cwd: dir
	});
}

