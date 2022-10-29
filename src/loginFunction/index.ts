import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeAccessToken, makeRefreshToken } from '../shared/token';

const POST = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
	if (!event.body) {
		return {
			statusCode: 403,
			body: ''
		};
	}

	// TODO: if authenticated.

	const payload = Object.assign(
		JSON.parse(event.body, (key, value) => {
			return key === 'username' ? value : undefined;
		}),
		{ _id: '' }
	);
	const refreshToken = makeRefreshToken(payload);
	const accessToken = makeAccessToken(payload);
	return {
		statusCode: 200,
		body: '',
		multiValueHeaders: {
			'Set-Cookie': [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`],
		},
		headers: {
			httpOnly: true,
			secure: true,
			path: '/'
		}
	};
}

export const lambdaHandler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (event.httpMethod === 'POST') {
		return POST(event);
	}
	return {
		statusCode: 403,
		body: ''
	};
};
