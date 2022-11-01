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

export const verify = async (event: APIGatewayProxyEvent) => {
	return new Promise<[jwt.VerifyErrors | null, string | jwt.JwtPayload | undefined]>(resolve => {
		const header = event.headers['Authorization'];
		if (!header) {
			resolve([new jwt.JsonWebTokenError("Missing Authorization header."), undefined]);
			return;
		}
		const splitted = header.split(' ', 2);
		if (splitted.length !== 2 || splitted[0].toLowerCase() !== 'bearer') {
			resolve([new jwt.JsonWebTokenError("Missing Bearer token."), undefined]);
			return;
		}

		jwt.verify(splitted[1], refreshSecret, (err, decoded) => {
			if (err) {
				console.log(err);
			}
			resolve([err, decoded]);
		});
	});
}
