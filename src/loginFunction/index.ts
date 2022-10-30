import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from '../shared/payload';
import { makeAccessToken, makeRefreshToken } from '../shared/token';

const POST = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
	if (!event.body) {
		return {
			statusCode: 400,
			body: ''
		};
	}

	const body = JSON.parse(event.body);
	if (!body.username || !body.password) {
		return {
			statusCode: 400,
			body: ''
		};
	}
	// TODO: do authentication.

	body._id = '_id';
	const payload = makeProjectedPayload(body);
	const refreshToken = makeRefreshToken(payload);
	const accessToken = makeAccessToken(payload);
	return {
		statusCode: 200,
		body: '',
		multiValueHeaders: {
			'Set-Cookie': [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]
		},
		headers: {
			'HttpOnly': true,
			'Secure': true,
			'Path': '/'
		}
	};
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (event.httpMethod === 'POST') {
		return POST(event);
	}
	return {
		statusCode: 400,
		body: ''
	};
};
