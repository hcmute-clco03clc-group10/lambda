import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb';

export const GET = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	const tableName = event.pathParameters?.tableName;
	if (!tableName) {
		return {
			statusCode: 400,
			body: 'Missing table name.'
		};
	}

	let [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return {
			statusCode: 403,
			body: 'Unauthorized.'
		}
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
		return {
			statusCode: 400,
			body: res.$response.error.message
		}
	}
	
	const tables = res.Item!.tables?.values || [] as string[];
	return {
		statusCode: 200,
		body: JSON.stringify(tables),
		headers: Object.assign({
			'Content-Type': 'application/json'
		}, setCookie)
	}
}

