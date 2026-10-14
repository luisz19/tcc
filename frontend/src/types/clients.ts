export interface Client {
	id: string;
	name: string;
	phone: string;
	email: string | null;
	address: string | null;
	personType: PersonType | null;
	createdAt: string;
	updatedAt: string;
}

export enum PersonType {
	INDIVIDUAL = 'individual',
	COMPANY = 'company',
}
