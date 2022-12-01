import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { makeAccessToken, makeRefreshToken } from 'shared/token';
import { verify } from 'shared/pbkdf2';
import { ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

const POST = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond.text(400, 'Missing credentials.');
	}

	const body = JSON.parse(event.body);
	if (!body.username || !body.password) {
		return http.respond.text(400, 'Missing credentials.');
	}

	const res = await ddc.query({
		TableName: 'users',
		IndexName: 'usernameIndex',
		KeyConditionExpression: 'username = :username',
		Select: 'SPECIFIC_ATTRIBUTES',
		ProjectionExpression: 'id, username, salt, password',
		ExpressionAttributeValues: {
			':username': body.username
		},
		Limit: 1
	}).promise();

	if (res.$response.error) {
		return http.respond.error(500, res.$response.error);
	}
	if (res.Count !== 1) {
		return http.respond.text(400, 'Bad credentials, login failed.');
	}

	const item = res.Items![0];
	const ok = await verify(body.password, item.salt, item.password);
	if (!ok) {
		return http.respond.text(400, 'Bad credentials, login failed.');
	}

	body.id = item.id;
	const payload = makeProjectedPayload(body);
	const refreshToken = makeRefreshToken(payload);
	const accessToken = makeAccessToken(payload);

	return http.respond.text(200, `Logged in successfully`, {
		'HttpOnly': true,
		'Secure': true,
		'Path': '/',
		'Content-Type': 'text/plain',
		'Set-Cookie': [`refreshToken=${refreshToken}; SameSite=None; Secure`, `accessToken=${accessToken}; SameSite=None; Secure`],
		'Access-Control-Allow-Origin': event.headers.origin!,
	})
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
