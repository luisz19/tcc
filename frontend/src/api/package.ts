import api from "./api";
import type { Package } from "@/types/packages";

export async function getPackages(): Promise<Package[]> {
  const { data } = await api.get<Package[]>("/packages");
  return data;
}
