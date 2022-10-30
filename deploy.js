const path = require('path');
const { readdirSync, statSync } = require('fs');
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
const argv = process.argv.slice(2);
const dirs = argv.length
	? globDirs(dist).filter(dir => argv.includes(path.basename(dir)))
	: globDirs(dist);

for (const dir of dirs) {
	const basename = path.basename(dir);
	console.log(`> deploy ${basename}`);
	execSync(`aws lambda update-function-code --function-name ${basename} --zip-file fileb://${dir}.zip`, {
		cwd: dir
	});
}

