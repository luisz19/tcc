import api from "./api";
import type { DashboardSummaryResponse } from "@/types/dashboard";

export async function getDashboardSummary(
  month?: number,
  year?: number
): Promise<DashboardSummaryResponse> {
  const { data } = await api.get<DashboardSummaryResponse>("/dashboard", {
    params: {
      ...(month !== undefined ? { month } : {}),
      ...(year !== undefined ? { year } : {}),
    },
  });
  return data;
}
