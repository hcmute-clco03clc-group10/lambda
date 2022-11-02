import AWS from 'aws-sdk';

export const lambda = new AWS.Lambda({
	region: 'us-east-1',
	apiVersion: 'latest',
})

