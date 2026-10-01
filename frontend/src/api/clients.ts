import api from './api';
import type { Client } from '@/types/clients';

export async function getClients(): Promise<Client[]> {
	const { data } = await api.get<Client[]>('/clients');
	return data;
}
