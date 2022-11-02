import crypto from 'crypto';
import { makeHash, makeSalt } from '../pbkdf2';
import { ddc } from '.';

export const put = async (username: string, email: string, password: string) => {
	const salt = makeSalt();
	const [err, hash] = await makeHash(password, salt);
	if (err) {
		return err;
	}
	return ddc.put({
		TableName: 'users',
		Item: {
			_id: crypto.randomUUID(),
			username,
			email,
			salt,
			password: hash,
		}
	}).promise();
}

