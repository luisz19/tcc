import api from "./api";
import type { Project, ProjectStatus } from "@/types/projects";

export interface ProjectPayload {
  clientId: string;
  packageId?: string | null;
  status?: ProjectStatus;
  title: string;
  local?: string;
  date?: string;
  notes?: string;
  agreed_price?: number;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { data } = await api.post<Project>("/projects", payload);
  return data;
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}
