import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { put } from 'shared/dynamodb/users';
import { ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

const POST = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond(event).text(400, 'Missing credentials.');
	}

	const body = JSON.parse(event.body);
	if (!body.email || !body.password) {
		return http.respond(event).text(400, 'Missing credentials.');
	}

	const query = await ddc
		.query({
			TableName: 'users',
			IndexName: 'emailIndex',
			KeyConditionExpression: 'email = :email',
			Limit: 1,
			Select: 'COUNT',
			ExpressionAttributeValues: {
				':email': body.email,
			},
		})
		.promise();

	if (query.Count) {
		return http.respond(event).text(400, 'Email is already in used.');
	}

	const res = await put(body.email, body.password);
	if (res.$response.error) {
		return http.respond(event).error(500, res.$response.error);
	}
	return http.respond(event).text(201, 'Signed up successfully.');
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
