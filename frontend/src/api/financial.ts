import api from "./api";
import type {
  Financial,
  FinancialPayload,
  MonthlyFinancialResponse,
} from "@/types/financial";

export async function getFinancials(): Promise<Financial[]> {
  const { data } = await api.get<Financial[]>("/financial");
  return data;
}

export async function getFinancialMonthly(
  month: number,
  year: number,
): Promise<MonthlyFinancialResponse> {
  const { data } = await api.get<MonthlyFinancialResponse>(
    "/financial/monthly",
    { params: { month, year } },
  );
  return data;
}

export async function getFinancial(id: string): Promise<Financial> {
  const { data } = await api.get<Financial>(`/financial/${id}`);
  return data;
}

export async function getFinancialByProjectId(
  projectId: string,
): Promise<Financial[]> {
  const { data } = await api.get<Financial[]>(
    `/financial/project/${projectId}`,
  );
  return data;
}

export async function getProjectBalance(projectId: string): Promise<number> {
  const { data } = await api.get<number>(
    `/financial/project/${projectId}/balance`,
  );
  return data;
}

export async function createFinancial(
  payload: FinancialPayload,
): Promise<Financial> {
  const { data } = await api.post<Financial>("/financial", payload);
  return data;
}

export async function updateFinancial(
  id: string,
  payload: Partial<FinancialPayload>,
): Promise<Financial> {
  const { data } = await api.patch<Financial>(`/financial/${id}`, payload);
  return data;
}

export async function deleteFinancial(id: string): Promise<void> {
  await api.delete(`/financial/${id}`);
}
