import crypto from 'crypto';
import { makeHash, makeSalt } from '../pbkdf2';
import { ddc } from '.';
import type { PromiseResult } from 'aws-sdk/lib/request';
import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import type { AWSError } from 'aws-sdk';

export const put = async (username: string, email: string, password: string) => {
	const salt = makeSalt();
	const [err, hash] = await makeHash(password, salt);
	if (err) {
		return {
			$response: {
				error: err
			}
		} as PromiseResult<DocumentClient.PutItemOutput, AWSError>;
	}
	return ddc.put({
		TableName: 'users',
		Item: {
			id: crypto.randomUUID(),
			username,
			email,
			salt,
			password: hash,
		}
	}).promise();
}

