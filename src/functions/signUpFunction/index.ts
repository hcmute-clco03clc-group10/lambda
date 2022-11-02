import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { put } from 'shared/dynamodb/users';

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
	if (event.httpMethod === 'POST') {
		return POST(event);
	}
	return {
		statusCode: 400,
		body: ''
	};
};
