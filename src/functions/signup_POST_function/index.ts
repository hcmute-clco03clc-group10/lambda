import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { put } from 'shared/dynamodb/users';
import { ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

const POST = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond.text(400, 'Missing credentials.');
	}

	const body = JSON.parse(event.body);
	if (!body.username || !body.email || !body.password) {
		return http.respond.text(400, 'Missing credentials.');
	}

	const queries = await Promise.all([
		ddc.query({
			TableName: 'users',
			IndexName: 'usernameIndex',
			KeyConditionExpression: 'username = :username',
			Limit: 1,
			Select: 'COUNT',
			ExpressionAttributeValues: {
				':username': body.username,
			},
		}).promise(),
		ddc.query({
			TableName: 'users',
			IndexName: 'emailIndex',
			KeyConditionExpression: 'email = :email',
			Limit: 1,
			Select: 'COUNT',
			ExpressionAttributeValues: {
				':email': body.email
			},
		}).promise(),
	]);

	if (queries.some(v => v.Count)) {
		return http.respond.text(400, 'Username or email is already in used.');
	}

	const res = await put(body.username, body.email, body.password);
	if (res.$response.error) {
		return http.respond.error(500, res.$response.error);
	}
	return http.respond.text(201, 'Signed up successfully.');
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
