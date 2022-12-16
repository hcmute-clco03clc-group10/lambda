import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb-v3';
import { AttributeValue, GetItemCommand } from '@aws-sdk/client-dynamodb';
import * as http from 'shared/http';

export const GET = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (!event.pathParameters) {
		return http.respond(event).error(400, 'missing parameters');
	}

	const { tableName, base64Body } = event.pathParameters;
	if (!tableName || !base64Body) {
		return http.respond(event).error(400, 'missing parameters');
	}

	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}

	const body = Buffer.from(base64Body, 'base64').toString('ascii');
	let data: Record<string, AttributeValue>;
	try {
		data = JSON.parse(body);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	try {
		const result = await ddc.send(
			new GetItemCommand({
				TableName: `${decoded.id}_${tableName}`,
				Key: data,
			})
		);
		return http.respond(event).json(200, result.Item || {}, setCookie);
	} catch (err) {
		return http.respond(event).error(500, err as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
