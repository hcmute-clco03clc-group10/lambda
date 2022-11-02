import { globDirs } from 'shared/glob';
import path from 'path';
import { lambda } from 'shared/lambda';
import fs from 'fs';

const dist = path.resolve('dist/functions');
const argv = process.argv.slice(2);
const dirs = argv.length
	? globDirs(dist).filter(dir => argv.includes(path.basename(dir)))
	: globDirs(dist);

for (const dir of dirs) {
	const basename = path.basename(dir);
	fs.readFile(`${dir}.zip`, (err, data) => {
		if (err) {
			console.log(`> ${basename}: ${err.message}`);
			return;
		}
		lambda.updateFunctionCode({
			FunctionName: basename,
			ZipFile: data
		}, (err, data) => {
			if (err) {
				console.log(`> ${basename}: ${err.message}`);
				return;
			}
			console.log(`> ${basename}: ${data.State}, ${data.LastUpdateStatus}, ${data.LastUpdateStatusReasonCode}, ${data.CodeSize} bytes`);
		});
	})
}

