import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import {
	extractToken,
	makeAccessToken,
	verifyRefreshToken,
} from 'shared/token';
import * as http from 'shared/http';

const GET = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const [err, decoded] = await verifyRefreshToken(
		extractToken(event, 'refreshToken')
	);
	if (err) {
		return http.respond.error(400, err);
	}
	return http.respond.json(200, decoded, {
		'Set-Cookie': `accessToken=${makeAccessToken(
			makeProjectedPayload(decoded)
		)}; SameSite=None; Secure`,
		HttpOnly: true,
		Secure: true,
		Path: '/',
	});
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
