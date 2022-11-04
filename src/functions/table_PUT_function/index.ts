import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb';

export const PUT = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return {
			statusCode: 400,
			body: 'Missing form data.'
		};
	}

	const body = JSON.parse(event.body);
	if (!body.tableName
		|| !body.partitionKey
		|| !body.partitionKeyType
		|| body.provisionedReadCapacity == null
		|| body.provisionedWriteCapacity == null) {
		return {
			statusCode: 400,
			body: 'Missing form data.'
		};
	}

	let [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return {
			statusCode: 403,
			body: "Unauthorized."
		}
	}
	// decoded = {
	// 	id: '304865d3-c2ec-491b-9d61-0f1c1e4bd1ec',
	// 	username: 'test2'
	// }

	const get = await ddc.get({
		TableName: 'users',
		Key: {
			id: decoded.id,
			username: decoded.username
		},
		ProjectionExpression: "tables"
	}).promise();

	if (get.$response.error) {
		return {
			statusCode: 400,
			body: get.$response.error.message
		};
	}

	const tables = get.Item!.tables?.values as string[] | undefined;
	if (tables && tables.includes(body.tableName)) {
		return {
			statusCode: 400,
			body: 'Table already existed.'
		};
	}

	const update = await ddc.update({
		TableName: 'users',
		Key: {
			id: decoded.id,
			username: decoded.username
		},
		UpdateExpression: 'ADD tables :table',
		ExpressionAttributeValues: {
			':table': ddc.createSet([body.tableName])
		},
	}).promise();

	if (update.$response.error) {
		return {
			statusCode: 400,
			body: update.$response.error.message
		}
	}

	const keySchemas = [{ AttributeName: body.partitionKey, KeyType: 'HASH' }];
	const attributeDefinitions = [{ AttributeName: body.partitionKey, AttributeType: body.partitionKeyType }];
	if (body.sortKey && body.sortKeyType) {
		keySchemas.push({ AttributeName: body.sortKey, KeyType: 'RANGE' });
		attributeDefinitions.push({ AttributeName: body.sortKey, AttributeType: body.sortKeyType });
	}

	const { $response, TableDescription } = await ddb.createTable({
		TableName: `${decoded.id}_${body.tableName}`,
		KeySchema: keySchemas,
		AttributeDefinitions: attributeDefinitions,
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	}).promise();

	if ($response.error) {
		return {
			statusCode: 500,
			body: $response.error.message
		}
	}

	return {
		statusCode: 201,
		body: TableDescription!.TableStatus!,
		headers: Object.assign({
			'Content-Type': 'application/json',
		}, setCookie)
	}
}


export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return PUT(event);
};
