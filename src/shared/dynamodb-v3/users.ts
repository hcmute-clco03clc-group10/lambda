import crypto from 'crypto';
import { makeHash, makeSalt } from '../pbkdf2';
import { ddc } from '.';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';

export const put = async (email: string, password: string) => {
	const salt = makeSalt();
	const [err, hash] = await makeHash(password, salt);
	if (err) {
		throw err;
	}
	return ddc.send(
		new PutItemCommand({
			TableName: 'users',
			Item: {
				id: { S: crypto.randomUUID() },
				email: { S: email },
				salt: { S: salt },
				password: { S: hash },
			},
		})
	);
};
