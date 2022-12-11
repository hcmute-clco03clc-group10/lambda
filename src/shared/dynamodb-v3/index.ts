import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const ddc = new DynamoDBClient({
	apiVersion: '2012-08-10',
	region: 'us-east-1',
});

export const ddb = new DynamoDB({
	apiVersion: '2012-08-10',
	region: 'us-east-1',
});
