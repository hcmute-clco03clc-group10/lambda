import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
		return http.respond(event).error(400, err);
	}
	const accessToken = makeAccessToken(makeProjectedPayload(decoded));
	return http.respond(event).json(
		200,
		{
			id: decoded.id,
			email: decoded.email,
			accessToken,
		},
		{
			'Set-Cookie': `accessToken=${accessToken}; SameSite=None; Secure`,
			HttpOnly: true,
			Secure: true,
			Path: '/',
		}
	);
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
