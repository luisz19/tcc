export const projectStatuses = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "canceled",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export interface Project {
  id: string;
  userId?: string;
  clientId: string;
  packageId?: string;
  title: string;
  startAt: string;
  endAt: string;
  local: string | null;
  notes: string | null;
  status: ProjectStatus;
  agreed_price: number | string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClientProjectSummary = Pick<Project, "id" | "title" | "startAt" | "endAt">;
