import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAccessTokenOrResign } from 'shared/token';
import { ddc } from 'shared/dynamodb-v3';
import * as http from 'shared/http';
import { DeleteTableCommand } from '@aws-sdk/client-dynamodb';

export const POST = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const [err, decoded, setCookie] = await verifyAccessTokenOrResign(event);
	if (err) {
		return http.respond(event).unauthorized();
	}

	let data: string[];
	try {
		data = JSON.parse(event.body!);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}

	if (!data || !Array.isArray(data)) {
		return http
			.respond(event)
			.error(400, 'body is empty or must be an array', setCookie);
	}

	try {
		const results = await Promise.allSettled(
			data.map((name) =>
				ddc.send(
					new DeleteTableCommand({
						TableName: `${decoded.id}_${name}`,
					})
				)
			)
		);
		const fulfilled = results.filter(
			(result) => result.status === 'fulfilled'
		);
		return http
			.respond(event)
			.json(200, { deletedCount: fulfilled.length }, setCookie);
	} catch (error) {
		return http.respond(event).error(400, error as Error, setCookie);
	}
};

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return POST(event);
};
