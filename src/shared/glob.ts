import path from 'path';
import fs from 'fs';

export const globDirs = (src: string) => {
	const dirs = [];
	for (const i of fs.readdirSync(src)) {
		const p = path.resolve(src, i);
		const stats = fs.statSync(p);
		if (stats.isDirectory()) {
			dirs.push(p);
		}
	}
	return dirs;
}
