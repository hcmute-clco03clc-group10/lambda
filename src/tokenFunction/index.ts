import jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeAccessToken } from '../shared/token';

const refreshSecret = process.env.JWT_REFRESH_SECRET;

const GET = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
	const cookie = (event.headers.Cookie || '')
		.split(',')
		.reduce((acc, v) => {
			const splitted = v.split('=');
			acc[splitted[0]] = splitted[1];
			return acc;
		}, {} as { [key: string]: string | undefined });

	if (!cookie.refreshToken) {
		return {
			statusCode: 403,
			body: ''
		}
	}

	const refreshToken = cookie.refreshToken;
	const payload = jwt.verify(refreshToken, refreshSecret);
	if (!payload) {
		return {
			statusCode: 403,
			body: ''
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello world',
		}),
		headers: {
			'Set-Cookie': `accessToken=${makeAccessToken(payload)}`,
			'httpOnly': true,
			'secure': true,
		}
	};
}

export const lambdaHandler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (event.httpMethod === 'GET') {
		return GET(event);
	}
	return {
		statusCode: 403,
		body: ''
	};
};
