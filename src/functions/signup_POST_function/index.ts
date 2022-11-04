import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { put } from 'shared/dynamodb/users';
import { ddc } from 'shared/dynamodb';

const POST = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return {
			statusCode: 400,
			body: 'Missing credentials.'
		};
	}

	const body = JSON.parse(event.body);
	if (!body.username || !body.email || !body.password) {
		return {
			statusCode: 400,
			body: 'Missing credentials.'
		};
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
		return {
			statusCode: 400,
			body: 'Username or email was used.'
		}
	}

	const res = await put(body.username, body.email, body.password);
	if (res instanceof Error) {
		return {
			statusCode: 500,
			body: res.message
		}
	}

	if (res.$response.error) {
		return {
			statusCode: 500,
			body: res.$response.error.message
		}
	}
	return {
		statusCode: 200,
		body: 'Signed up successfully.',
		headers: {
			'Content-Type': 'text/plain'
		}
	}
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
