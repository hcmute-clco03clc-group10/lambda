import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb';
import * as http from 'shared/http';

export const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond.unauthorized();
	}

	const res = await ddc.get({
		TableName: 'users',
		Key: {
			id: decoded.id,
			username: decoded.username
		},
		ProjectionExpression: 'tables'
	}).promise();

	if(res.$response.error) {
		return http.respond.error(400, res.$response.error);
	}
	
	const tables = res.Item!.tables?.values || [] as string[];
	return http.respond.json(200, tables, setCookie);
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return GET(event);
};
