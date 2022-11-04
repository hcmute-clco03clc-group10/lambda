import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { extractToken, makeAccessToken, verifyRefreshToken } from 'shared/token';

const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const [err, decoded] = await verifyRefreshToken(extractToken(event, 'refreshToken'));
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
			'Set-Cookie': `accessToken=${makeAccessToken(makeProjectedPayload(decoded))}`,
			'HttpOnly': true,
			'Secure': true,
			'Path': '/'
		}
	};
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
