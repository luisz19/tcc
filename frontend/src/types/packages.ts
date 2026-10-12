export interface Package {
  id: string;
  name: string;
  description: string | null;
  base_price: number | string;
  createdAt: string;
  updatedAt: string;
}
