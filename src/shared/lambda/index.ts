import { LambdaClient } from '@aws-sdk/client-lambda';

export const lambda = new LambdaClient({
	region: 'us-east-1',
	apiVersion: 'latest',
});
