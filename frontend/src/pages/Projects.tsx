import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Calendar,
  CalendarDays,
  FolderKanban,
  LoaderCircle,
  MapPin,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getClients } from "@/api/clients";
import { getProjects } from "@/api/project";
import type { Client } from "@/types/clients";
import {
  projectStatuses,
  type Project,
  type ProjectStatus,
} from "@/types/projects";
import SearchInput from "@/components/common/SearchInput";
import { cn } from "@/lib/utils";
import "../App.css";

interface ProjectsProps {
  onOpenPackages: () => void;
  onCreateProject: () => void;
  onViewProject: (project: Project) => void;
}

type StatusFilter = "all" | ProjectStatus;

const statusLabels: Record<ProjectStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  canceled: "Cancelado",
};

const statusBadgeClasses: Record<ProjectStatus, string> = {
  confirmed: "bg-[#dde1ff] text-[#0040e0]",
  in_progress: "bg-[#e7e8e9] text-[#434656]",
  pending: "bg-[#fff0d4] text-[#8a5b00]",
  completed: "bg-[#dcfce7] text-[#15803d]",
  canceled: "bg-[#fee2e2] text-[#b91c1c]",
};

const MONTH_SHORT_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function formatMoney(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatProjectDateTime(startAt: string | null): string {
  if (!startAt) return "Data a definir";
  const date = new Date(startAt);
  if (isNaN(date.getTime())) return "Data a definir";

  const day = String(date.getDate()).padStart(2, "0");
  const monthStr = MONTH_SHORT_NAMES[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime ? `${day}/${monthStr} • ${hours}:${minutes}` : `${day}/${monthStr}`;
}

function getErrorMessage(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401
    ? "Sua sessão expirou. Entre novamente para visualizar os projetos."
    : "Não foi possível carregar os projetos agora.";
}

function Projects({
  onOpenPackages,
  onCreateProject,
  onViewProject,
}: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.all([getProjects(), getClients()])
      .then(([projectData, clientData]) => {
        if (isMounted) {
          setProjects(projectData);
          setClients(clientData);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );
  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      const clientName = clientNames.get(project.clientId) ?? "";
      const matchesSearch =
        !normalizedSearch ||
        [project.title, project.local ?? "", clientName].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });
  }, [clientNames, projects, search, statusFilter]);

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-label text-primary">
              Aperture Operations
            </p>
            <h2 className="text-2xl font-semibold leading-8 text-on-surface">
              Seus projetos
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {onOpenPackages && (
              <button
                className="grid size-9 place-items-center rounded-xl border border-surface-container bg-surface-container-lowest text-on-surface-variant transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
                type="button"
                onClick={onOpenPackages}
                aria-label="Abrir pacotes"
                title="Abrir pacotes"
              >
                <FolderKanban className="size-4 text-primary" aria-hidden="true" />
              </button>
            )}
            {!isLoading && !errorMessage && (
              <p className="text-sm text-on-surface-variant">
                {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar projetos..."
            ariaLabel="Buscar projetos"
          />
        </div>

        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          aria-label="Filtrar projetos por status"
        >
          {(["all", ...projectStatuses] as StatusFilter[]).map((status) => (
            <button
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                statusFilter === status
                  ? "bg-primary text-white shadow-sm"
                  : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
            >
              {status === "all" ? "Todos" : statusLabels[status]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center text-primary"
            aria-live="polite"
            aria-label="Carregando projetos"
          >
            <LoaderCircle
              className="animate-login-spin size-6"
              aria-hidden="true"
            />
          </div>
        )}

        {!isLoading && errorMessage && (
          <Alert
            variant="destructive"
            className="border-error/25 bg-error-container text-on-error-container"
          >
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !errorMessage && filteredProjects.length === 0 && (
          <Card className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-dashed border-surface-container bg-surface-container-lowest/50 px-6 py-10 text-center ring-0 gap-0">
            <CalendarDays
              className="mb-3 size-7 text-outline"
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold text-on-surface">
              {projects.length
                ? "Nenhum projeto encontrado"
                : "Você ainda não tem projetos"}
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">
              {projects.length
                ? "Tente buscar por outro título, cliente ou local."
                : "Seus projetos aparecerão aqui quando forem cadastrados."}
            </p>
          </Card>
        )}

        {!isLoading && !errorMessage && filteredProjects.length > 0 && (
          <div className="grid gap-3" aria-label="Lista de projetos">
            {filteredProjects.map((project) => (
              <Card
                className="group cursor-pointer rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-level-1 ring-0 gap-0 transition hover:border-outline-variant/60 hover:shadow-level-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                key={project.id}
                onClick={() => onViewProject(project)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onViewProject(project);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Visualizar projeto ${project.title}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {project.title}
                  </span>
                  <Badge
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border-0 shadow-none hover:opacity-90",
                      statusBadgeClasses[project.status]
                    )}
                  >
                    {statusLabels[project.status]}
                  </Badge>
                </div>

                <h3 className="mt-1 text-base font-bold text-on-surface">
                  {clientNames.get(project.clientId) ?? "Cliente não associado"}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Calendar className="size-3.5 text-outline shrink-0" />
                  <span>
                    {formatProjectDateTime(project.startAt)}
                    {project.notes ? ` (${project.notes})` : ""}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-surface-container/60 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MapPin className="size-3.5 text-outline shrink-0" />
                    <span className="truncate max-w-[220px]">
                      {project.local || "Local a combinar"}
                    </span>
                  </div>

                  {project.agreed_price !== null &&
                  project.agreed_price !== undefined &&
                  project.agreed_price !== "" ? (
                    <span className="text-sm font-bold text-on-surface">
                      {formatMoney(project.agreed_price)}
                    </span>
                  ) : (
                    <span className="text-xs text-primary font-medium group-hover:underline">
                      Ver detalhes
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <button
        className="fixed bottom-6 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 transition-transform hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:bottom-8 sm:right-8"
        type="button"
        onClick={onCreateProject}
        aria-label="Adicionar projeto"
        title="Adicionar projeto"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
    </main>
  );
}

export default Projects;
