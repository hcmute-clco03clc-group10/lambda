import { usersSchema } from 'shared/dynamodb-v3/users.schema';
import { ddb } from 'shared/dynamodb-v3';

console.log(`> create table users`);
ddb.createTable(usersSchema, (err) => {
	if (err) {
		console.log(`> error: ${err.message}`);
	}
});
