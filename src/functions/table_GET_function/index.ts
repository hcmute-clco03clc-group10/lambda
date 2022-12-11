import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

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
	const res = await ddc
		.get({
			TableName: 'users',
			Key: { id: decoded.id, email: decoded.email },
			ProjectionExpression: 'tables',
		})
		.promise();
	if (res.$response.error) {
		return http.respond(event).error(400, res.$response.error, setCookie);
	}
	const tables = res.Item!.tables?.values as string[];
	if (!tables || !tables.includes(name)) {
		return http.respond(event).json(200, {}, setCookie);
	}

	const result = await ddb
		.describeTable({
			TableName: `${decoded.id}_${name}`,
		})
		.promise();
	if (result.$response.error) {
		return http.respond(event).error(502, result.$response.error);
	}
	const table = result.Table;
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
	const res = await ddc
		.get({
			TableName: 'users',
			Key: { id: decoded.id, email: decoded.email },
			ProjectionExpression: 'tables',
		})
		.promise();
	if (res.$response.error) {
		return http.respond(event).error(400, res.$response.error, setCookie);
	}
	const tables = res.Item!.tables?.values as string[];
	if (!tables) {
		return http.respond(event).json(200, [], setCookie);
	}

	const results = await Promise.all(
		tables.map((table) =>
			ddb
				.describeTable({
					TableName: `${decoded.id}_${table}`,
				})
				.promise()
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
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
