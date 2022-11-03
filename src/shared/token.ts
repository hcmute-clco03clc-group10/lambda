import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Payload } from './payload';

const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessSecret = process.env.JWT_ACCESS_SECRET;

export const makeAccessToken = (payload: string | object | Buffer) => {
	return jwt.sign(payload, accessSecret, {
		expiresIn: '15m'
	});
}
export const makeRefreshToken = (payload: string | object | Buffer) => {
	return jwt.sign(payload, refreshSecret, {
		expiresIn: '30d'
	});
}

export const verifyAccessToken = (token: string | undefined) => {
	return verifyToken(token, accessSecret);
}

export const verifyRefreshToken = (token: string | undefined) => {
	return verifyToken(token, refreshSecret);
}

export const verifyToken = (token: string | undefined, secret: string) => {
	return new Promise<[jwt.VerifyErrors | null, Payload]>(resolve => {
		if (!token) {
			resolve([new JsonWebTokenError('Missing token.'), null!])
			return;
		}
		jwt.verify(token, secret, (err, decoded) => {
			resolve([err, decoded as Payload]);
		});
	});
}

export const verifyAccessTokenOrResign = (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, Payload, { 'Set-Cookie': string } | undefined]>(resolve => {
		const token = extractToken(event, 'accessToken');
		if (!token) {
			resolve([new JsonWebTokenError('Missing token.'), null!, undefined])
			return;
		}
		jwt.verify(token, accessSecret, async (err, decoded) => {
			if (err instanceof TokenExpiredError) {
				const [err, decoded] = await verifyRefreshToken(extractToken(event, 'refreshToken'));
				if (!err) {
					resolve([err, decoded as Payload, { 'Set-Cookie': `accessToken=${makeAccessToken(decoded)}` }]);
					return;
				}
			}
			resolve([err, decoded as Payload, undefined]);
		});
	});
}

export const extractToken = (event: APIGatewayProxyEvent, key: 'refreshToken' | 'accessToken') => {
	let token = event.headers['Authorization'];
	if (!token) {
		const cookie = event.headers['Cookie'];
		if (cookie) {
			token = cookie
				.split(';')
				.find(v => v.trimStart().startsWith(`${key}=`));
			if (token) {
				token = token.split('=', 2)[1];
			}
		}
	} else {
		const splitted = token.split(' ', 2);
		if (splitted.length === 2 && splitted[0].toLowerCase() === 'bearer') {
			token = splitted[1];
		}
	}
	return token;
}

