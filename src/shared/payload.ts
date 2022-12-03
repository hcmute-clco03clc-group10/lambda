export interface Payload {
	id: string;
	email: string;
}

export const makeProjectedPayload = (obj: Payload & { [key: string]: any }): Payload => {
	for(const key in obj) {
		if (key === 'id'
		|| key === 'email') {
			continue;
		}
		delete obj[key];
	}
	return obj;
}
