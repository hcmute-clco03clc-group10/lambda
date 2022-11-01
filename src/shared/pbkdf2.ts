import crypto from 'node:crypto';

export const makeSalt = () => crypto.randomBytes(16).toString('base64');

export const makeHash = (password: string, salt: string) => {
	return new Promise<[Error | null, string]>(resolve => {
		crypto.pbkdf2(password, salt, 4096, 64, 'sha512', (err, hash) => {
			if (err) {
				resolve([err, '']);
				return;
			}
			resolve([null, hash.toString('base64')]);
		});
	})
}

export const verify = async (password: string, salt: string, hash: string) => {
	const [err, hashed] = await makeHash(password, salt);
	if (err) {
		return false;
	}
	return hashed === hash;
}
