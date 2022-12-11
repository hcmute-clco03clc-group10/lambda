import { globDirs } from 'shared/glob';
import path from 'path';
import { lambda } from 'shared/lambda';
import fs from 'fs';
import { UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda';

const dist = path.resolve('dist/functions');
const argv = process.argv.slice(2);
const dirs = argv.length
	? globDirs(dist).filter((dir) => argv.includes(path.basename(dir)))
	: globDirs(dist);

for (const dir of dirs) {
	const basename = path.basename(dir);
	fs.readFile(`${dir}.zip`, (err, data) => {
		if (err) {
			console.log(`> ${basename}: ${err.message}`);
			return;
		}
		lambda
			.send(
				new UpdateFunctionCodeCommand({
					FunctionName: basename.replace('{', '').replace('}', ''),
					ZipFile: data,
				})
			)
			.then((data) => {
				console.log(
					`> ${basename}: ${data.State}, ${data.LastUpdateStatus}, ${data.LastUpdateStatusReasonCode}, ${data.CodeSize} bytes`
				);
			})
			.catch((error) => {
				console.log(`> ${basename}: ${error.message}`);
			});
	});
}
