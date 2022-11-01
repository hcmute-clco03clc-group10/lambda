import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload, Payload } from 'shared/payload';
import { makeAccessToken, verify } from 'shared/token';
import type { JwtPayload } from 'jsonwebtoken';

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
			'Set-Cookie': `accessToken=${makeAccessToken(makeProjectedPayload(decoded as Payload & JwtPayload))}`,
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
