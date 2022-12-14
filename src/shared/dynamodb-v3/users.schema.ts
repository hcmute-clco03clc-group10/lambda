import type { CreateTableInput } from '@aws-sdk/client-dynamodb';

export const usersSchema: CreateTableInput = {
	TableName: 'users',
	KeySchema: [
		{ AttributeName: 'id', KeyType: 'HASH' },
		{ AttributeName: 'email', KeyType: 'RANGE' },
	],
	AttributeDefinitions: [
		{ AttributeName: 'id', AttributeType: 'S' },
		{ AttributeName: 'email', AttributeType: 'S' },
	],
	GlobalSecondaryIndexes: [
		{
			IndexName: 'emailIndex',
			KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
			ProvisionedThroughput: {
				ReadCapacityUnits: 5,
				WriteCapacityUnits: 5,
			},
			Projection: {
				ProjectionType: 'INCLUDE',
				NonKeyAttributes: ['id', 'password', 'salt'],
			},
		},
	],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5,
	},
};
