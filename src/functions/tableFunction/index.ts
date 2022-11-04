import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PUT } from './put';

export const handler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	switch(event.httpMethod.toUpperCase()) {
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
