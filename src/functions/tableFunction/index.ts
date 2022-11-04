import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PUT } from './put';
import { GET } from './get';

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	switch(event.httpMethod.toUpperCase()) {
		case 'GET': {
			return GET(event);
		}
		case 'PUT': {
			return PUT(event);
		}
		default: {
			return {
				statusCode: 400,
				body: ''
			};
		}
	}
};
