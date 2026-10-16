import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteClient, getClient, getProjectsByClientId } from "@/api/clients";
import type { Client } from "@/types/clients";
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
import type { ClientProjectSummary } from "@/types/projects";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectsByClient, setProjectsByClient] = useState<
    ClientProjectSummary[]
  >([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;
    void Promise.all([getClient(id), getProjectsByClientId(id)])
      .then(([clientData, projectData]) => {
        if (isMounted) {
          setClient(clientData);
          setProjectsByClient(projectData);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            isAxiosError(error) && error.response?.status === 404
              ? "Cliente não encontrado."
              : "Não foi possível carregar este cliente."
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
    if (!client) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");
    try {
      await deleteClient(client.id);
      setIsDeleteDialogOpen(false);
      navigate("/clients");
    } catch {
      setErrorMessage("Não foi possível excluir o cliente agora.");
      setIsDeleting(false);
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
            onClick={() => navigate("/clients")}
            aria-label="Voltar para clientes"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-label text-primary">
              Aperture Operations
            </p>
            <h1 className="text-lg font-semibold">Detalhes do cliente</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center text-primary"
            aria-label="Carregando cliente"
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
        {!isLoading && client && (
          <>
            <Card className="border-0 bg-surface-container-lowest shadow-level-1">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-fixed text-lg font-semibold text-on-primary-fixed"
                    aria-hidden="true"
                  >
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold">
                      {client.name}
                    </h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {client.personType === "company"
                        ? "Pessoa jurídica"
                        : "Pessoa física"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-4 border-0 bg-surface-container-lowest shadow-level-1">
              <CardContent className="grid gap-5 p-5">
                <h2 className="text-base font-semibold">
                  Informações de contato
                </h2>
                <div className="grid gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Telefone
                      </p>
                      <p className="mt-1">{client.phone || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">E-mail</p>
                      <p className="mt-1 break-all">
                        {client.email || "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Endereço
                      </p>
                      <p className="mt-1">
                        {client.address || "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2
                      className="mt-0.5 size-4 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs text-on-surface-variant">
                        Tipo de cadastro
                      </p>
                      <p className="mt-1">
                        {client.personType === "company"
                          ? "Pessoa jurídica"
                          : "Pessoa física"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <section className="mt-6" aria-labelledby="client-projects-title">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2
                  id="client-projects-title"
                  className="text-base font-semibold"
                >
                  Projetos do cliente
                </h2>
                <span className="text-sm text-on-surface-variant">
                  {projectsByClient.length}
                </span>
              </div>
              {projectsByClient.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant px-5 py-8 text-center text-sm text-on-surface-variant">
                  Este cliente ainda não possui projetos.
                </div>
              ) : (
                <div className="grid gap-3">
                  {projectsByClient.map((project) => (
                    <Card
                      className="cursor-pointer border-0 bg-surface-container-lowest shadow-level-1 transition-shadow hover:shadow-level-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/projects/${project.id}`);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Visualizar projeto ${project.title}`}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold">
                            {project.title}
                          </h3>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-on-surface-variant">
                          <CalendarDays
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {project.date
                            ? new Intl.DateTimeFormat("pt-BR").format(
                                new Date(`${project.date}T00:00:00`)
                              )
                            : "Data não informada"}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
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
                  navigate(`/clients/${client.id}/edit`, { state: { client } })
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
            <DialogTitle>Excluir cliente?</DialogTitle>
            <DialogDescription>
              Essa ação removerá{" "}
              {client?.name ? (
                <strong className="font-semibold text-on-surface">
                  {client.name}
                </strong>
              ) : (
                "este cliente"
              )}{" "}
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
              {isDeleting ? "Excluindo..." : "Excluir cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default ClientDetails;
