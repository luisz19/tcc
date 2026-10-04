export interface Client {
	id: string;
	name: string;
	phone: string;
	email: string | null;
	address: string | null;
	personType: string | null;
	createdAt: string;
	updatedAt: string;
}
