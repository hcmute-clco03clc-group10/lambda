import { APIGatewayProxyResult } from 'aws-lambda';
import * as http from 'shared/http';

export const handler = async (): Promise<APIGatewayProxyResult> => {
	return http.respond.text(200, '/v1 API.');
};
