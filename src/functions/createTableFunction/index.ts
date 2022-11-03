import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { makeProjectedPayload } from 'shared/payload';
import { makeAccessToken, makeRefreshToken, verifyAccessToken, verifyRefreshToken } from 'shared/token';
import { verify } from 'shared/pbkdf2';
import { ddc, ddb } from 'shared/dynamodb';
import { TokenExpiredError } from 'jsonwebtoken';

const PUT = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

	let [err, decoded] = await verifyAccessToken(event);
	outer: if (err) {
		if (err instanceof TokenExpiredError) {
			[err, decoded] = await verifyRefreshToken(event);
			if (!err) {
				break outer;
			}
		}
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
		headers: {
			'Content-Type': 'application/json'
		}
	}
}

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	if (event.httpMethod === 'PUT') {
		return PUT(event);
	}
	return {
		statusCode: 400,
		body: ''
	};
};
