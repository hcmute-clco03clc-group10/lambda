import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';

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

export const verifyRefreshToken = async (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, string | jwt.JwtPayload | undefined]>(resolve => {
		let token = event.headers['Authorization'];
		if (!token) {
			const cookie = event.headers['Cookie'];
			if (cookie) {
				token = cookie
					.split(';')
					.map(v => v.trimStart())
					.find(v => v.startsWith('refreshToken='));
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
			resolve([new jwt.JsonWebTokenError("Missing refresh token."), undefined]);
			return;
		}
		jwt.verify(token, refreshSecret, (err, decoded) => {
			if (err) {
				console.log(err);
			}
			resolve([err, decoded]);
		});
	});
}
