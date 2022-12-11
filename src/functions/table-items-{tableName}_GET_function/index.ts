import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb-v3';
import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as http from 'shared/http';
import { QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

export const GET = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const tableName = event.pathParameters?.tableName;
	if (!tableName) {
		return http.respond(event).text(400, 'Missing table name.');
	}

	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}
	try {
		const query = new QueryCommand({
			TableName: 'users',
			KeyConditionExpression: 'id = :id',
			FilterExpression: 'contains(tables, :tableName)',
			ExpressionAttributeValues: {
				':id': { S: decoded.id },
				':tableName': { S: tableName },
			},
			Select: 'COUNT',
		});
		const result = await ddc.send(query);
		if (!result.Count) {
			return http.respond(event).text(404, 'table not found');
		}

		let lastEvaluatedKey: DocumentClient.Key | undefined;
		const items = [];
		do {
			const scan = new ScanCommand({
				TableName: `${decoded.id}_${tableName}`,
				Limit: 25,
				ExclusiveStartKey: lastEvaluatedKey,
			});
			const result = await ddc.send(scan);
			items.push(...result.Items!);
			lastEvaluatedKey = result.LastEvaluatedKey;
		} while (lastEvaluatedKey);
		return http.respond(event).json(200, items, setCookie);
	} catch (err) {
		return http.respond(event).error(500, err as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
