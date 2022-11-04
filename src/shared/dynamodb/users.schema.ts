import * as AWS from 'aws-sdk';

export const usersSchema: AWS.DynamoDB.CreateTableInput = {
	TableName: 'users',
	KeySchema: [
		{ AttributeName: 'id', KeyType: 'HASH' },
		{ AttributeName: 'username', KeyType: 'RANGE' },
	],
	AttributeDefinitions: [
		{ AttributeName: 'id', AttributeType: 'S' },
		{ AttributeName: 'username', AttributeType: 'S' },
		{ AttributeName: 'email', AttributeType: 'S' },
	],
	GlobalSecondaryIndexes: [
		{
			IndexName: 'usernameIndex',
			KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
			ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
			Projection: {
				ProjectionType: 'INCLUDE',
				NonKeyAttributes: [ 'id', 'email', 'password', 'salt' ]
			}
		},
		{
			IndexName: 'emailIndex',
			KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
			ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
			Projection: {
				ProjectionType: 'INCLUDE',
				NonKeyAttributes: [ 'id', 'username', 'password', 'salt' ]
			}
		}
	],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5,
	},
};

