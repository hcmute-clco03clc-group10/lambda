import { APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResult> => {
	return {
		statusCode: 200,
		body: '/v1 API stage.'
	};
};
