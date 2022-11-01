import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeAccessToken, verify } from 'shared/token';

const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const [err, decoded] = await verify(event);
	if (err) {
		return {
			statusCode: 400,
			body: err.message
		}
	}
	return {
		statusCode: 200,
		body: 'New access token granted.',
		headers: {
			'Set-Cookie': `accessToken=${makeAccessToken(decoded!)}`,
			'HttpOnly': true,
			'Secure': true,
			'Path': '/'
		}
	};
}

export const handler = async (
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
