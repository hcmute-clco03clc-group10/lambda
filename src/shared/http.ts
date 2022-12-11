import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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

export const respond = (event: APIGatewayProxyEvent) => {
	return {
		text: __text.bind(null, event),
		json: __json.bind(null, event),
		error: __error.bind(null, event),
		unauthorized: __unauthorized.bind(null, event),
	};
};

const __text = (
	event: APIGatewayProxyEvent,
	statusCode: number,
	body: string,
	header?: MultiValueHeader
): APIGatewayProxyResult => {
	const multiValueHeaders: { [key: string]: string[] } = {};
	for (const k in header) {
		if (Array.isArray(header[k])) {
			multiValueHeaders[k] = (header as MultiValueHeader)[k] as string[];
			delete header[k];
		}
	}
	return {
		statusCode,
		body,
		headers: Object.assign(
			{
				...corsHeaders,
				'Content-Type': 'text/plain',
				'Access-Control-Allow-Origin': event.headers.origin,
			},
			header
		) as Header,
		multiValueHeaders,
	};
};

const __json = (
	event: APIGatewayProxyEvent,
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
			multiValueHeaders[k] = (header as MultiValueHeader)[k] as string[];
			delete header[k];
		}
	}
	return {
		statusCode,
		body: body as string,
		headers: Object.assign(
			{
				...corsHeaders,
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': event.headers.origin,
			},
			header as Header
		),
		multiValueHeaders,
	};
};

const __error = (
	event: APIGatewayProxyEvent,
	statusCode: number,
	error: Error,
	header?: Header
): APIGatewayProxyResult => {
	return {
		statusCode,
		body: `${error.name}: ${error.message}`,
		headers: Object.assign(
			{
				...corsHeaders,
				'Content-Type': 'text/plain',
				'Access-Control-Allow-Origin': event.headers.origin,
			},
			header
		),
	};
};

const __unauthorized = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
	return __text(event, 403, 'Unauthorized.');
};
