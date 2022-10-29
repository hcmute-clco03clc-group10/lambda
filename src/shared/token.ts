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
