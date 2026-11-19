import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  ChevronRight,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getClients } from "@/api/clients";
import type { Client } from "@/types/clients";
import SearchInput from "@/components/common/SearchInput";
import "../App.css";

interface ClientsProps {
  onCreateClient: () => void;
  onViewClient: (client: Client) => void;
}

function formatPhone(phone: string) {
  return phone || "Telefone não informado";
}

function Clients({ onCreateClient, onViewClient }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void getClients()
      .then((data) => {
        if (isMounted) {
          setClients(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            isAxiosError(error) && error.response?.status === 401
              ? "Sua sessão expirou. Entre novamente para visualizar os clientes."
              : "Não foi possível carregar os clientes agora."
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
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.email, client.phone]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
    );
  }, [clients, search]);

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-label text-primary">
              Aperture Operations
            </p>
            <h2 className="text-2xl font-semibold leading-8 text-on-surface">
              Sua rede de clientes
            </h2>
          </div>
          {!isLoading && !errorMessage && (
            <p className="text-sm text-on-surface-variant">
              {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
            </p>
          )}
        </div>

        <div className="mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar clientes..."
            ariaLabel="Buscar clientes"
          />
        </div>

        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center text-primary"
            aria-live="polite"
            aria-label="Carregando clientes"
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

        {!isLoading && !errorMessage && filteredClients.length === 0 && (
          <Card className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-dashed border-surface-container bg-surface-container-lowest/50 px-6 py-10 text-center ring-0 gap-0">
            <Search className="mb-3 size-7 text-outline" aria-hidden="true" />
            <h3 className="text-base font-semibold text-on-surface">
              {clients.length
                ? "Nenhum cliente encontrado"
                : "Você ainda não tem clientes"}
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">
              {clients.length
                ? "Tente buscar por outro nome, e-mail ou telefone."
                : "Seus clientes aparecerão aqui quando forem cadastrados."}
            </p>
          </Card>
        )}

        {!isLoading && !errorMessage && filteredClients.length > 0 && (
          <div className="grid gap-3" aria-label="Lista de clientes">
            {filteredClients.map((client) => (
              <Card
                className="group cursor-pointer rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-level-1 ring-0 gap-0 transition hover:border-outline-variant/60 hover:shadow-level-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                key={client.id}
                onClick={() => onViewClient(client)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onViewClient(client);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Visualizar cliente ${client.name}`}
              >
                <h3 className=" text-base font-bold text-on-surface">
                  {client.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-outline shrink-0" />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-outline shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {client.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-surface-container/60 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MapPin className="size-3.5 text-outline shrink-0" />
                    <span className="truncate max-w-[220px]">
                      {client.address || "Endereço não informado"}
                    </span>
                  </div>

                  <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-0.5">
                    Ver detalhes
                    <ChevronRight className="size-3 text-primary" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <button
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] right-4 z-40 grid size-12 place-items-center rounded-2xl bg-primary text-white shadow-level-2 transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:scale-95 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:bottom-24 sm:right-8 cursor-pointer"
        type="button"
        onClick={onCreateClient}
        aria-label="Adicionar cliente"
        title="Adicionar cliente"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
    </main>
  );
}

export default Clients;
