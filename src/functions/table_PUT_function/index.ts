import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb-v3';
import * as http from 'shared/http';
import {
	GetItemCommand,
	GetItemCommandOutput,
	UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';

export const PUT = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (!event.body) {
		return http.respond(event).error(400, 'Missing form data.');
	}

	const body = JSON.parse(event.body);
	if (
		!body.tableName ||
		!body.partitionKey ||
		!body.partitionKeyType ||
		body.provisionedReadCapacity == null ||
		body.provisionedWriteCapacity == null
	) {
		return http.respond(event).error(400, 'Missing form data.');
	}

	let [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}

	let get: GetItemCommandOutput;
	try {
		get = await ddc.send(
			new GetItemCommand({
				TableName: 'users',
				Key: { id: { S: decoded.id }, email: { S: decoded.email } },
				ProjectionExpression: 'tables',
			})
		);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	const tables = get.Item!.tables?.SS as string[] | undefined;
	if (tables && tables.includes(body.tableName)) {
		return http.respond(event).text(400, 'Table already existed.');
	}

	try {
		await ddc.send(
			new UpdateItemCommand({
				TableName: 'users',
				Key: { id: { S: decoded.id }, email: { S: decoded.email } },
				UpdateExpression: 'add tables :table',
				ExpressionAttributeValues: {
					':table': { SS: [body.tableName] },
				},
				ReturnValues: 'NONE',
			})
		);
	} catch (error) {
		return http.respond(event).error(500, error as Error, setCookie);
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

	try {
		await ddb.createTable({
			TableName: `${decoded.id}_${body.tableName}`,
			KeySchema: keySchemas,
			AttributeDefinitions: attributeDefinitions,
			ProvisionedThroughput: {
				ReadCapacityUnits: Number(body.provisionedReadCapacity) || 5,
				WriteCapacityUnits: Number(body.provisionedWriteCapacity) || 5,
			},
		});
	} catch (error) {
		return http.respond(event).error(502, error as Error, setCookie);
	}
	return http
		.respond(event)
		.text(201, 'Table is now being created.', setCookie);
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return PUT(event);
};
