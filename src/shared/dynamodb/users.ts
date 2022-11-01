import { makeHash, makeSalt } from '../pbkdf2';
import { ddc } from '.';

export const put = async (username: string, password: string) => {
	const salt = makeSalt();
	return ddc.put({
		TableName: 'users',
		Item: {
			_id: crypto.randomUUID(),
			username,
			salt,
			password: await makeHash(password, salt)
		}
	}).promise();
}

