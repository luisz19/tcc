import api from './api';
import type { Client } from '@/types/clients';

export interface ClientPayload {
	name: string;
	phone: string;
	email?: string;
	address?: string;
	personType?: string;
}

export async function getClients(): Promise<Client[]> {
	const { data } = await api.get<Client[]>('/clients');
	return data;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
	const { data } = await api.post<Client>('/clients', payload);
	return data;
}

export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
	const { data } = await api.patch<Client>(`/clients/${id}`, payload);
	return data;
}
