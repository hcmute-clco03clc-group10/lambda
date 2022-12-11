import crypto from 'crypto';
import * as AWS from 'aws-sdk';
import { globDirs } from 'shared/glob';
import path from 'path';

const lambda = new AWS.Lambda({
	region: 'us-east-1',
	apiVersion: 'latest',
});
const makeSecret = () => crypto.randomBytes(256).toString('base64');
const JWT_ACCESS_SECRET = makeSecret();
const JWT_REFRESH_SECRET = makeSecret();

console.log(`> make access secret: ${JWT_ACCESS_SECRET}`);
console.log(`> make refresh secret: ${JWT_REFRESH_SECRET}`);

for (const dir of globDirs('dist/functions')) {
	const basename = path.basename(dir);
	console.log(`> configure ${basename} environment variables`);
	lambda.updateFunctionConfiguration(
		{
			FunctionName: basename.replace('{', '').replace('}', ''),
			Environment: {
				Variables: {
					JWT_ACCESS_SECRET,
					JWT_REFRESH_SECRET,
				},
			},
		},
		(err) => {
			if (err) {
				console.log(
					`> ${basename} failed to configure - ${err.message}`
				);
				return;
			}
		}
	);
}
