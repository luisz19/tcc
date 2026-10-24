import api from "./api";
import type { Package } from "@/types/packages";

export async function getPackages(): Promise<Package[]> {
  const { data } = await api.get<Package[]>("/packages");
  return data;
}

export interface PackagePayload {
  name: string;
  description?: string;
  base_price: number;
}

export async function createPackage(payload: PackagePayload): Promise<Package> {
  const { data } = await api.post<Package>("/packages", payload);
  return data;
}

export async function updatePackage(id: string, payload: Partial<PackagePayload>): Promise<Package> {
  const { data } = await api.patch<Package>(`/packages/${id}`, payload);
  return data;
}

export async function deletePackage(id: string, confirm = false): Promise<void> {
  await api.delete(`/packages/${id}`, {
    params: confirm ? { confirm: true } : undefined,
  });
}
