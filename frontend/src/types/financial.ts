export const financialStatuses = ["pending", "paid", "canceled"] as const;
export const financialTypes = ["income", "expense"] as const;

export type FinancialStatus = (typeof financialStatuses)[number];
export type FinancialType = (typeof financialTypes)[number];

export interface Financial {
  id: string;
  userId: string;
  projectId: string;
  type: FinancialType;
  status: FinancialStatus;
  description: string | null;
  value: number | string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialPayload {
  projectId: string;
  type: FinancialType;
  status: FinancialStatus;
  description?: string;
  value: number;
  date: string;
}

export interface FinancialSummary {
  incomePaid: number;
  expensePaid: number;
  monthlyResult: number;
}

export interface MonthlyFinancialResponse {
  summary: FinancialSummary;
  financials: Financial[];
}
