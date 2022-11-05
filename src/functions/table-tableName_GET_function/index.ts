import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as http from 'shared/http';

export const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const tableName = event.pathParameters?.tableName;
	if (!tableName) {
		return http.respond.text(400, 'Missing table name.');
	}

	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond.unauthorized();
	}

	const query = await ddc.query({
		TableName: 'users',
		KeyConditionExpression: 'id = :id',
		FilterExpression: 'contains(tables, :tableName)',
		ExpressionAttributeValues: {
			':id': decoded.id,
			':tableName': tableName
		},
		Select: 'COUNT',
	}).promise();

	if (query.$response.error) {
		return http.respond.error(400, query.$response.error);
	}

	if (!query.Count) {
		return http.respond.text(404, 'Table not found.');
	}

	let lastEvaluatedKey: DocumentClient.Key | undefined;
	const items = [];
	do {
		const get = await ddc.scan({
			TableName: `${decoded.id}_${tableName}`,
			Limit: 25,
			ExclusiveStartKey: lastEvaluatedKey
		}).promise();
		if (get.$response.error) {
			return http.respond.error(500, get.$response.error);
		}
		items.push(...get.Items!);
		lastEvaluatedKey = get.LastEvaluatedKey;
	} while (lastEvaluatedKey);

	return http.respond.json(200, items, setCookie);
}


export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
}
