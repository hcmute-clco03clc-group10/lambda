import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb-v3';
import { BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import * as http from 'shared/http';

export const POST = async (
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

	let body: { [key: string]: any }[];
	try {
		body = JSON.parse(event.body!);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	try {
		const result = await ddc.send(new BatchWriteItemCommand({
			RequestItems: {
				[`${decoded.id}_${tableName}`]: body.map(k => ({
					DeleteRequest: {
						Key: k
					}
				}))
			},
		}));
		return http.respond(event).text(result.$metadata.httpStatusCode!, '', setCookie);
	} catch (error) {
		return http.respond(event).error(500, error as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
