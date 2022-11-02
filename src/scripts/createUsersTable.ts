import { usersSchema } from 'shared/dynamodb/users.schema';
import { ddb } from 'shared/dynamodb';

console.log(`> create table users`);
ddb.createTable(usersSchema, (err) => {
	if (err) {
		console.log(`> error: ${err.message}`);
	}
});


