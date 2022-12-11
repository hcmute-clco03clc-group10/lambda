import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as http from 'shared/http';

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	return http.respond(event).text(200, '/v1');
};
