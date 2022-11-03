import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
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

export const verifyAccessToken = async (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, Payload]>(resolve => {
		let token = event.headers['Authorization'];
		if (!token) {
			const cookie = event.headers['Cookie'];
			if (cookie) {
				token = cookie
					.split(';')
					.find(v => v.trimStart().startsWith('accessToken='));
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
		if (!token) {
			resolve([new jwt.JsonWebTokenError("Missing access token."), null!]);
			return;
		}
		jwt.verify(token, accessSecret, async (err, decoded) => {
			resolve([err, decoded as Payload]);
		});
	});
}

export const verifyRefreshToken = async (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, Payload]>(resolve => {
		let token = event.headers['Authorization'];
		if (!token) {
			const cookie = event.headers['Cookie'];
			if (cookie) {
				token = cookie
					.split(';')
					.find(v => v.trimStart().startsWith('refreshToken='));
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
		if (!token) {
			resolve([new jwt.JsonWebTokenError("Missing refresh token."), null!]);
			return;
		}
		jwt.verify(token, refreshSecret, (err, decoded) => {
			if (err) {
				console.log(err);
			}
			resolve([err, decoded as Payload]);
		});
	});
}

export const verifyAccessTokenOrResign= async (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, Payload, { 'Set-Cookie': string } | undefined]>(resolve => {
		let token: string | undefined;
		const cookie = event.headers['Cookie'];
		if (cookie) {
			token = cookie
				.split(';')
				.find(v => v.trimStart().startsWith('accessToken='));
			if (token) {
				token = token.split('=', 2)[1];
			}
		}
		if (!token) {
			resolve([new jwt.JsonWebTokenError("Missing access token."), null!, undefined]);
			return;
		}
		jwt.verify(token, accessSecret, async (err, decoded) => {
			if (err instanceof TokenExpiredError) {
				const [err, decoded] = await verifyAccessToken(event);
				if (!err) {
					resolve([err, decoded as Payload, { 'Set-Cookie': makeAccessToken(decoded) }]);
					return;
				}
			}
			resolve([err, decoded as Payload, undefined]);
		});
	});
}
