import { MonthlyFinancialSummary } from 'src/financial/financial.service';
import { ProjectStatus } from 'src/project/model/project.model';

export interface ProjectSummaryItem {
  id: string;
  title: string;
  clientName: string;
  startAt: Date | null;
  status: ProjectStatus;
}

export interface ProjectSummary {
  totalActive: number;
  upcomingProjects: ProjectSummaryItem[];
}

export interface ClientsSummary {
  totalClients: number;
}

export interface DashboardSummaryResponse {
  period: {
    month?: number;
    year?: number;
  };
  financial: MonthlyFinancialSummary;
  projects: ProjectSummary;
  clients: ClientsSummary;
}
