import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  LoaderCircle,
  MapPin,
  PackageOpen,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProject, updateProject } from "@/api/project";
import { getClients } from "@/api/clients";
import { getPackages } from "@/api/package";
import type { Client } from "@/types/clients";
import type { Package } from "@/types/packages";
import { projectStatuses, type Project, type ProjectStatus } from "@/types/projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "../../App.css";

const statusLabels: Record<ProjectStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  canceled: "Cancelado",
};

const statusClasses: Record<ProjectStatus, string> = {
  pending: "bg-surface-container text-on-surface-variant",
  confirmed: "bg-primary-fixed text-on-primary-fixed",
  in_progress: "bg-primary-fixed text-on-primary-fixed",
  completed: "bg-surface-container-high text-on-surface-variant",
  canceled: "bg-error-container text-on-error-container",
};

function formatDate(date: string | null) {
  if (!date) {
    return "Data não informada";
  }

  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day)
  );
}

function formatPrice(price: number | string | null) {
  if (price === null || price === "") {
    return "Valor não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(price));
}

function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [packageItem, setPackageItem] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;
    void Promise.all([getProject(id), getClients(), getPackages()])
      .then(([projectData, clients, packages]) => {
        if (isMounted) {
          setProject(projectData);
          setClient(
            clients.find(
              ({ id: clientId }) => clientId === projectData.clientId
            ) ?? null
          );
          setPackageItem(
            packages.find(
              ({ id: packageId }) => packageId === projectData.packageId
            ) ?? null
          );
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            isAxiosError(error) && error.response?.status === 404
              ? "Projeto não encontrado."
              : "Não foi possível carregar este projeto."
          );
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
  }, [id]);

  async function handleDelete() {
    if (!project) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");
    try {
      await deleteProject(project.id);
      setIsDeleteDialogOpen(false);
      navigate("/projects");
    } catch {
      setErrorMessage("Não foi possível excluir o projeto agora.");
      setIsDeleting(false);
    }
  }

  async function handleStatusChange(status: ProjectStatus) {
    if (!project || status === project.status) {
      return;
    }

    setIsUpdatingStatus(true);
    setErrorMessage("");
    try {
      const updatedProject = await updateProject(project.id, { status });
      setProject(updatedProject);
    } catch {
      setErrorMessage("Não foi possível atualizar o status agora.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-5 sm:px-8">
          <Button
            className="size-10 rounded-full text-on-surface-variant hover:bg-surface-container"
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => navigate("/projects")}
            aria-label="Voltar para projetos"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-label text-primary">
              Aperture Operations
            </p>
            <h1 className="text-lg font-semibold">Detalhes do projeto</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center text-primary"
            aria-label="Carregando projeto"
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
        {!isLoading && project && (
          <>
            <Card className="border-0 bg-surface-container-lowest shadow-level-1">
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-label text-primary">
                      Projeto
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {project.title}
                    </h2>
                  </div>
                  <select
                    className={`h-8 rounded-full border-0 px-3 text-xs font-semibold outline-none ring-primary/30 focus:ring-2 ${statusClasses[project.status]}`}
                    value={project.status}
                    onChange={(event) => void handleStatusChange(event.target.value as ProjectStatus)}
                    disabled={isUpdatingStatus}
                    aria-label="Status do projeto"
                  >
                    {projectStatuses.map((status) => (
                      <option value={status} key={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-on-surface-variant">
                  {client?.name ?? "Cliente não encontrado"}
                </p>
              </CardContent>
            </Card>
            <Card className="mt-4 border-0 bg-surface-container-lowest shadow-level-1">
              <CardContent className="grid gap-5 p-5">
                <h2 className="text-base font-semibold">
                  Informações do projeto
                </h2>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">Data</p>
                      <p className="mt-1">{formatDate(project.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CircleDollarSign
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Valor combinado
                      </p>
                      <p className="mt-1">
                        {formatPrice(project.agreed_price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">Local</p>
                      <p className="mt-1">{project.local || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PackageOpen
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">Pacote</p>
                      <p className="mt-1">
                        {packageItem?.name ?? "Nenhum pacote vinculado"}
                      </p>
                    </div>
                  </div>
                </div>
                {project.notes && (
                  <div className="border-t border-surface-container pt-4">
                    <p className="text-xs text-on-surface-variant">
                      Observações
                    </p>
                    <p className="mt-1 text-sm leading-6">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                className="h-12 text-error hover:bg-error-container sm:min-w-32"
                variant="outline"
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" />
                Excluir
              </Button>
              <Button
                className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-32"
                type="button"
                onClick={() =>
                  navigate(`/projects/${project.id}/edit`, {
                    state: { project },
                  })
                }
              >
                <Edit3 aria-hidden="true" />
                Editar
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir projeto?</DialogTitle>
            <DialogDescription>
              Essa ação removerá{" "}
              <strong className="font-semibold text-on-surface">
                {project?.title}
              </strong>{" "}
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <Alert
              variant="destructive"
              className="border-error/25 bg-error-container text-on-error-container"
            >
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button" disabled={isDeleting} />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting && (
                <LoaderCircle
                  className="animate-login-spin"
                  aria-hidden="true"
                />
              )}
              {isDeleting ? "Excluindo..." : "Excluir projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default ProjectDetails;
