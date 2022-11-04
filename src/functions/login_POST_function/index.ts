import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { makeAccessToken, makeRefreshToken } from 'shared/token';
import { verify } from 'shared/pbkdf2';
import { ddc } from 'shared/dynamodb';

const POST = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return {
			statusCode: 400,
			body: ''
		};
	}

	const body = JSON.parse(event.body);
	if (!body.username || !body.password) {
		return {
			statusCode: 400,
			body: ''
		};
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
		return {
			statusCode: 500,
			body: res.$response.error.message
		}
	}
	if (res.Count !== 1) {
		return {
			statusCode: 400,
			body: 'Bad credentials, login failed.'
		}
	}

	const item = res.Items![0];
	const ok = await verify(body.password, item.salt, item.password);
	if (!ok) {
		return {
			statusCode: 400,
			body: 'Bad credentials, login failed.'
		}
	}

	body.id = item.id;
	const payload = makeProjectedPayload(body);
	const refreshToken = makeRefreshToken(payload);
	const accessToken = makeAccessToken(payload);
	return {
		statusCode: 200,
		body: 'Logged in successfully.',
		multiValueHeaders: {
			'Set-Cookie': [`refreshToken=${refreshToken}`, `accessToken=${accessToken}`]
		},
		headers: {
			'HttpOnly': true,
			'Secure': true,
			'Path': '/',
			'Content-Type': 'text/plain'
		}
	};
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
