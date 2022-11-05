import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const tableName = event.pathParameters?.tableName;
	if (!tableName) {
		return {
			statusCode: 400,
			body: 'Missing table name.'
		};
	}

	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return {
			statusCode: 403,
			body: 'Unauthorized.',
			headers: {
				'Content-Type': 'text/plain'
			},
		}
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
		return {
			statusCode: 400,
			body: query.$response.error.message,
			headers: {
				'Content-Type': 'text/plain'
			},
		}
	}

	if (!query.Count) {
		return {
			statusCode: 404,
			body: 'Table not found.',
			headers: {
				'Content-Type': 'text/plain'
			},
		}
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
			return {
				statusCode: 500,
				body: get.$response.error.message
			}
		}
		items.push(...get.Items!);
		lastEvaluatedKey = get.LastEvaluatedKey;
	} while (lastEvaluatedKey);

	return {
		statusCode: 200,
		body: JSON.stringify(items),
		headers: Object.assign({
			'Content-Type': 'application/json'
		}, setCookie)
	}
}


export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
}
