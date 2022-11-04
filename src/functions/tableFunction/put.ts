import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddb } from 'shared/dynamodb';

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

	const keySchemas = [{ AttributeName: body.partitionKey, KeyType: 'HASH' }];
	const attributeDefinitions = [{ AttributeName: body.partitionKey, AttributeType: body.partitionKeyType }];
	if (body.sortKey && body.sortKeyType) {
		keySchemas.push({ AttributeName: body.sortKey, KeyType: 'RANGE' });
		attributeDefinitions.push({ AttributeName: body.sortKey, AttributeType: body.sortKeyType });
	}

	const { $response, TableDescription } = await ddb.createTable({
		TableName: `${decoded._id}_body.tableName`,
		KeySchema: keySchemas,
		AttributeDefinitions: attributeDefinitions
	}).promise();

	if ($response.error) {
		return {
			statusCode: 500,
			body: $response.error.message
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify(TableDescription),
		headers: Object.assign({
			'Content-Type': 'application/json',
		}, setCookie)
	}
}

