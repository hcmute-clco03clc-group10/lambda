import AWS from 'aws-sdk';

export const ddc = new AWS.DynamoDB.DocumentClient({
	apiVersion: '2012-08-10',
	region: 'us-east-1'
});

export const ddb = new AWS.DynamoDB({
	apiVersion: '2012-08-10',
	region: 'us-east-1'
});

