import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { makeAccessToken, makeRefreshToken } from 'shared/token';
import * as AWS from 'aws-sdk';
import { verify } from 'shared/pbkdf2';

const ddc = new AWS.DynamoDB.DocumentClient({
	apiVersion: '2012-08-10',
	region: 'us-east-1'
});

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
		ProjectionExpression: 'password, salt',
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
			statusCode: 406,
			body: 'Bad credentials, login failed.'
		}
	}

	const item = res.Items![0];
	const ok = await verify(body.password, item.salt, item.password);
	if (!ok) {
		return {
			statusCode: 406,
			body: 'Bad credentials, login failed.'
		}
	}

	body._id = '_id';
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
	if (event.httpMethod === 'POST') {
		return POST(event);
	}
	return {
		statusCode: 400,
		body: ''
	};
};
