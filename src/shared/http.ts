import { APIGatewayProxyResult } from "aws-lambda";

type Header = Omit<{ [key: string]: string | number | boolean}, 'Content-Type'>;

export const respond = {
	text: (statusCode: number, body: string, headers?: Header): APIGatewayProxyResult => {
		return { statusCode, body: body as string, headers: Object.assign({ 'Content-Type': 'text/plain' }, headers) };
	},
	json: (statusCode: number, body: string | Object, headers?: Header): APIGatewayProxyResult => {
		if (typeof body === 'object') {
			body = JSON.stringify(body);
		}
		return { statusCode, body: body as string, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) };
	},
	error: (statusCode: number, error: Error, headers?: Header): APIGatewayProxyResult => {
		return { statusCode, body: `${error.name}: ${error.message}`, headers: Object.assign({ 'Content-Type': 'text/plain' }, headers) };
	},
	unauthorized: (): APIGatewayProxyResult => {
		return respond.text(403, 'Unauthorized.');
	}
}

