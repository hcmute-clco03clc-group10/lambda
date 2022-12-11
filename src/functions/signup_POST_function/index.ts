import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { put } from 'shared/dynamodb-v3/users';
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
		const query = await ddc.send(
			new QueryCommand({
				TableName: 'users',
				IndexName: 'emailIndex',
				KeyConditionExpression: 'email = :email',
				Limit: 1,
				Select: 'COUNT',
				ExpressionAttributeValues: {
					':email': { S: body.email },
				},
			})
		);

		if (query.Count) {
			return http.respond(event).text(400, 'Email is already in used.');
		}

		const res = await put(body.email, body.password);
		return http
			.respond(event)
			.text(res.$metadata.httpStatusCode!, 'Signed up successfully.');
	} catch (err) {
		return http.respond(event).error(500, err as Error);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
