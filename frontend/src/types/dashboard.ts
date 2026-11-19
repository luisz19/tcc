import type { ProjectStatus } from "./projects";

export interface DashboardPeriod {
  month: number;
  year: number;
}

export interface DashboardFinancial {
  incomePaid: number;
  expensePaid: number;
  monthlyResult: number;
}

export interface UpcomingProject {
  id: string;
  title: string;
  clientName: string;
  startAt: string | null;
  status: ProjectStatus;
  local?: string | null;
  notes?: string | null;
  agreed_price?: number | string | null;
}

export interface DashboardProjects {
  totalActive: number;
  upcomingProjects: UpcomingProject[];
}

export interface DashboardClients {
  totalClients: number;
}

export interface DashboardSummaryResponse {
  period: DashboardPeriod;
  financial: DashboardFinancial;
  projects: DashboardProjects;
  clients: DashboardClients;
}
