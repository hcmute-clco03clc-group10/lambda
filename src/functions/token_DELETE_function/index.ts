import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractToken, verifyRefreshToken } from 'shared/token';
import * as http from 'shared/http';

const DELETE = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const [err, decoded] = await verifyRefreshToken(
		extractToken(event, 'refreshToken')
	);
	if (err) {
		return http.respond(event).error(400, err);
	}
	return http.respond(event).json(200, decoded, {
		'Set-Cookie': [
			'accessToken=; SameSite=None; Secure',
			'refreshToken=; SameSite=None; Secure',
		],
		HttpOnly: true,
		Secure: true,
		Path: '/',
	});
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return DELETE(event);
};
