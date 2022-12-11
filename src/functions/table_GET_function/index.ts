import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb, ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

export const GET = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
