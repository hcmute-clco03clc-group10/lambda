export interface Payload {
	_id: string;
	username: string;
}

export const makeProjectedPayload = (obj: Payload & { [key: string]: any }): Payload => {
	for(const key in obj) {
		if (key === 'id'
		|| key === 'username') {
			continue;
		}
		delete obj[key];
	}
	return obj;
}
