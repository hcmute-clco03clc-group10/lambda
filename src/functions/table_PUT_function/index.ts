import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

export const PUT = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond.text(400, 'Missing form data.');
	}

	const body = JSON.parse(event.body);
	if (
		!body.tableName ||
		!body.partitionKey ||
		!body.partitionKeyType ||
		body.provisionedReadCapacity == null ||
		body.provisionedWriteCapacity == null
	) {
		return http.respond.text(400, 'Missing form data.');
	}

	let [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond.unauthorized();
	}

	const get = await ddc
		.get({
			TableName: 'users',
			Key: decoded,
			ProjectionExpression: 'tables',
		})
		.promise();

	if (get.$response.error) {
		return http.respond.error(400, get.$response.error);
	}

	const tables = get.Item!.tables as { name: string }[] | undefined;
	if (tables && tables.some((v) => v.name === body.tableName)) {
		return http.respond.text(400, 'Table already existed.');
	}

	const update = await ddc
		.update({
			TableName: 'users',
			Key: decoded,
			UpdateExpression:
				'set tables = list_append(if_not_exists(tables, :empty), :table)',
			ExpressionAttributeValues: {
				':table': [{ name: body.tableName }],
				':empty': [],
			},
			ReturnValues: 'NONE',
		})
		.promise();

	if (update.$response.error) {
		return http.respond.error(400, update.$response.error);
	}

	const keySchemas = [{ AttributeName: body.partitionKey, KeyType: 'HASH' }];
	const attributeDefinitions = [
		{
			AttributeName: body.partitionKey,
			AttributeType: body.partitionKeyType,
		},
	];
	if (body.sortKey && body.sortKeyType) {
		keySchemas.push({ AttributeName: body.sortKey, KeyType: 'RANGE' });
		attributeDefinitions.push({
			AttributeName: body.sortKey,
			AttributeType: body.sortKeyType,
		});
	}

	const create = await ddb
		.createTable({
			TableName: `${decoded.id}_${body.tableName}`,
			KeySchema: keySchemas,
			AttributeDefinitions: attributeDefinitions,
			ProvisionedThroughput: {
				ReadCapacityUnits: body.provisionedReadCapacity || 5,
				WriteCapacityUnits: body.provisionedWriteCapacity || 5,
			},
		})
		.promise();

	if (create.$response.error) {
		return http.respond.error(400, create.$response.error);
	}
	return http.respond.text(201, 'Table is now being created.', setCookie);
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return PUT(event);
};
