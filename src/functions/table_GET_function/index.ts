import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb-v3';
import * as http from 'shared/http';
import {
	DescribeTableCommandOutput,
	GetItemCommand,
	GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb';

export const GET = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const name = event.queryStringParameters?.name;
	if (name) {
		return getOne(event, name);
	}
	return getAll(event);
};

const getOne = async (event: APIGatewayProxyEvent, name: string) => {
	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}
	let result: GetItemCommandOutput;
	try {
		result = await ddc.send(
			new GetItemCommand({
				TableName: 'users',
				Key: { id: { S: decoded.id }, email: { S: decoded.email } },
				ProjectionExpression: 'tables',
			})
		);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	const tables = result.Item!.tables?.SS as string[];
	if (!tables || !tables.includes(name)) {
		return http.respond(event).json(200, {}, setCookie);
	}

	let description: DescribeTableCommandOutput;
	try {
		description = await ddb.describeTable({
			TableName: `${decoded.id}_${name}`,
		});
	} catch (error) {
		return http.respond(event).error(500, error as Error, setCookie);
	}
	const table = description.Table;
	if (!table) {
		return http.respond(event).json(200, {}, setCookie);
	}
	table.TableName = table.TableName!.substring(
		table.TableName!.indexOf('_') + 1
	);
	return http.respond(event).json(200, table, setCookie);
};

const getAll = async (event: APIGatewayProxyEvent) => {
	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}
	let result: GetItemCommandOutput;
	try {
		result = await ddc.send(
			new GetItemCommand({
				TableName: 'users',
				Key: { id: { S: decoded.id }, email: { S: decoded.email } },
				ProjectionExpression: 'tables',
			})
		);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	const tables = result.Item!.tables?.SS as string[];
	if (!tables) {
		return http.respond(event).json(200, [], setCookie);
	}
	try {
		const results = await Promise.all(
			tables.map((table) =>
				ddb
					.describeTable({
						TableName: `${decoded.id}_${table}`,
					})
					.then((v) => v.Table)
			)
		);
		for (const result of results) {
			if (result) {
				result.TableName = result.TableName!.substring(
					result.TableName!.indexOf('_') + 1
				);
			}
		}
		return http.respond(event).json(200, results, setCookie);
	} catch (error) {
		return http.respond(event).error(500, error as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
