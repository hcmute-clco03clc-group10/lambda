import { APIGatewayProxyResult } from 'aws-lambda';

type Header = Omit<
	{ [key: string]: string | number | boolean },
	'Content-Type'
>;
type MultiValueHeader = Omit<
	{ [key: string]: string | number | boolean | string[] },
	'Content-Type'
>;

const corsHeaders = {
	'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
	'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
	'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept',
	'Access-Control-Allow-Credentials': 'true',
};

export const respond = {
	text: (
		statusCode: number,
		body: string,
		header?: MultiValueHeader
	): APIGatewayProxyResult => {
		const multiValueHeaders: { [key: string]: string[] } = {};
		for (const k in header) {
			if (Array.isArray(header[k])) {
				multiValueHeaders[k] = (header as MultiValueHeader)[
					k
				] as string[];
				delete header[k];
			}
		}
		return {
			statusCode,
			body: body as string,
			headers: Object.assign(
				{ ...corsHeaders, 'Content-Type': 'text/plain' },
				header
			) as Header,
			multiValueHeaders,
		};
	},
	json: (
		statusCode: number,
		body: string | Object,
		header?: MultiValueHeader
	): APIGatewayProxyResult => {
		if (body instanceof Object) {
			body = JSON.stringify(body);
		}
		const multiValueHeaders: { [key: string]: string[] } = {};
		for (const k in header) {
			if (Array.isArray(header[k])) {
				multiValueHeaders[k] = (header as MultiValueHeader)[
					k
				] as string[];
				delete header[k];
			}
		}
		return {
			statusCode,
			body: body as string,
			headers: Object.assign(
				{ ...corsHeaders, 'Content-Type': 'application/json' },
				header as Header
			),
			multiValueHeaders,
		};
	},
	error: (
		statusCode: number,
		error: Error,
		header?: Header
	): APIGatewayProxyResult => {
		return {
			statusCode,
			body: `${error.name}: ${error.message}`,
			headers: Object.assign(
				{ ...corsHeaders, 'Content-Type': 'text/plain' },
				header
			),
		};
	},
	unauthorized: (): APIGatewayProxyResult => {
		return respond.text(403, 'Unauthorized.');
	},
};
