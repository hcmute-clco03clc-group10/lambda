import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { makeAccessToken, makeRefreshToken } from 'shared/token';
import { verify } from 'shared/pbkdf2';
import { ddc } from 'shared/dynamodb-v3';
import * as http from 'shared/http';
import { QueryCommand } from '@aws-sdk/client-dynamodb';

const POST = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond(event).error(400, 'Missing credentials.');
	}

	const body = JSON.parse(event.body);
	if (!body.email || !body.password) {
		return http.respond(event).error(400, 'Missing credentials.');
	}

	try {
		const result = await ddc.send(
			new QueryCommand({
				TableName: 'users',
				IndexName: 'emailIndex',
				KeyConditionExpression: 'email = :email',
				Select: 'SPECIFIC_ATTRIBUTES',
				ProjectionExpression: 'id, email, salt, password',
				ExpressionAttributeValues: {
					':email': { S: body.email },
				},
				Limit: 1,
			})
		);

		if (result.Count !== 1) {
			return http
				.respond(event)
				.text(400, 'Bad credentials, login failed.');
		}

		const item = result.Items![0];
		const ok = await verify(body.password, item.salt.S!, item.password.S!);
		if (!ok) {
			return http
				.respond(event)
				.text(400, 'Bad credentials, login failed.');
		}

		body.id = item.id.S;
		const payload = makeProjectedPayload(body);
		const refreshToken = makeRefreshToken(payload);
		const accessToken = makeAccessToken(payload);

		return http.respond(event).text(200, `Logged in successfully`, {
			HttpOnly: true,
			Secure: true,
			Path: '/',
			'Content-Type': 'text/plain',
			'Set-Cookie': [
				`refreshToken=${refreshToken}; SameSite=None; Secure`,
				`accessToken=${accessToken}; SameSite=None; Secure`,
			],
		});
	} catch (err) {
		return http.respond(event).error(500, err as Error);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
