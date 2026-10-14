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

export const PersonType = {
	INDIVIDUAL: 'individual',
	COMPANY: 'company',
} as const

export type PersonType = (typeof PersonType)[keyof typeof PersonType]
