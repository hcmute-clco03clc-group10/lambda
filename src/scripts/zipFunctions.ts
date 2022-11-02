import path from 'path';
import { execSync } from 'child_process';
import { globDirs } from 'shared/glob';

const dist = path.resolve('dist/functions');
for(const dir of globDirs(dist)) {
	const basename = path.basename(dir);
	console.log(`> zip ${basename}`);
	execSync(`cd ${dist} && 7z a -tzip ${basename}.zip ${dir}/*`, {
		cwd: dir
	});
}

