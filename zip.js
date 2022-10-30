const path = require('path');
const { readdirSync, statSync } = require('fs');
const { execSync } = require('node:child_process');

console.log(process.argv);

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
	const basename = path.basename(dir);
	console.log(`> zip ${basename}`);
	execSync(`cd ${dist} && 7z a -tzip ${basename}.zip ${dir}/*`, {
		cwd: dir
	});
}

