import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb-v3';
import { AttributeValue, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as http from 'shared/http';

export const PUT = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const tableName = event.pathParameters?.tableName;
	if (!tableName) {
		return http.respond(event).text(400, 'missing {tableName} parameter');
	}

	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}

	let data: Record<string, AttributeValue>;
	try {
		data = JSON.parse(event.body!);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}
	try {
		await ddc.send(
			new PutItemCommand({
				TableName: `${decoded.id}_${tableName}`,
				Item: data,
			})
		);
		return http.respond(event).json(200, '', setCookie);
	} catch (error) {
		return http.respond(event).error(500, error as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return PUT(event);
};
