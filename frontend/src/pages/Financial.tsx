import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowDown,
  Edit3,
  LoaderCircle,
  Plus,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  deleteFinancial,
  getFinancialMonthly,
  getFinancials,
} from "@/api/financial";
import { getProjects } from "@/api/project";
import type { Financial, FinancialStatus } from "@/types/financial";
import type { Project } from "@/types/projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import "../App.css";

interface FinancialProps {
  onCreateFinancial: () => void;
  onEditFinancial: (financial: Financial) => void;
}
type Period = "all" | "this_month" | "last_month";
const statusLabels: Record<FinancialStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  canceled: "Cancelado",
};

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}
function formatDate(date: string) {
  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? "Data não informada"
    : new Intl.DateTimeFormat("pt-BR", { month: "short", day: "2-digit" })
        .format(parsedDate)
        .replace(".", "");
}
function getPeriodDates(period: Exclude<Period, "all">) {
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth() + (period === "this_month" ? 0 : -1),
    1
  );
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function FinancialPage({ onCreateFinancial, onEditFinancial }: FinancialProps) {
  const { logout } = useAuth();
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [summary, setSummary] = useState({
    received: 0,
    pending: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingFinancial, setDeletingFinancial] = useState<Financial | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const financialRequest =
      period === "all"
        ? getFinancials()
        : (() => {
            const { month, year } = getPeriodDates(period);
            return getFinancialMonthly(month, year).then(
              (response) => response.financials
            );
          })();
    void Promise.all([financialRequest, getProjects()])
      .then(([financialData, projectData]) => {
        if (!isMounted) return;
        setFinancials(financialData);
        setProjects(projectData);
        setSummary({
          received: financialData
            .filter((item) => item.type === "income" && item.status === "paid")
            .reduce((total, item) => total + Number(item.value), 0),
          pending: financialData
            .filter(
              (item) => item.type === "income" && item.status === "pending"
            )
            .reduce((total, item) => total + Number(item.value), 0),
          expenses: financialData
            .filter((item) => item.type === "expense" && item.status === "paid")
            .reduce((total, item) => total + Number(item.value), 0),
        });
      })
      .catch((error: unknown) => {
        if (isMounted)
          setErrorMessage(
            isAxiosError(error) && error.response?.status === 401
              ? "Sua sessão expirou. Entre novamente para visualizar o financeiro."
              : "Não foi possível carregar os lançamentos agora."
          );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [period]);

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects]
  );
  const totalRevenue = summary.received + summary.pending;

  async function handleDelete() {
    if (!deletingFinancial) return;
    setIsDeleting(true);
    try {
      await deleteFinancial(deletingFinancial.id);
      setFinancials((current) =>
        current.filter(({ id }) => id !== deletingFinancial.id)
      );
      setDeletingFinancial(null);
    } catch {
      setErrorMessage("Não foi possível excluir o lançamento agora.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <h1 className="text-xl font-semibold">Financeiro</h1>
          <button
            className="grid size-10 place-items-center rounded-full bg-primary text-on-primary"
            type="button"
            onClick={logout}
            aria-label="Sair da conta"
          >
            <UserRound className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </header>
      <section className="mx-auto w-full max-w-4xl px-5 pb-28 pt-5 sm:px-8 sm:pt-8">
        <div
          className="mb-5 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Período financeiro"
        >
          {(
            [
              ["all", "Todo período"],
              ["this_month", "Este mês"],
              ["last_month", "Mês passado"],
            ] as const
          ).map(([value, label]) => (
            <button
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium ${
                period === value
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-surface-container text-on-surface-variant"
              }`}
              key={value}
              type="button"
              onClick={() => {
                setIsLoading(true);
                setPeriod(value);
              }}
              aria-pressed={period === value}
            >
              {label}
            </button>
          ))}
        </div>
        {isLoading && (
          <div
            className="flex min-h-64 items-center justify-center text-primary"
            aria-label="Carregando financeiro"
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
        {!isLoading && !errorMessage && (
          <>
            <Card className="border-0 bg-gradient-to-br from-surface-container-lowest to-primary-fixed/30 shadow-level-1">
              <CardContent className="p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-label text-on-surface-variant">
                  Total de receitas
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {formatMoney(totalRevenue)}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-xs font-bold uppercase tracking-label text-on-surface-variant">
                      Recebido
                    </p>
                    <p className="mt-2 text-xl font-semibold text-primary">
                      {formatMoney(summary.received)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-xs font-bold uppercase tracking-label text-on-surface-variant">
                      Pendente
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatMoney(summary.pending)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-xs font-bold uppercase tracking-label text-on-surface-variant">
                      Despesas
                    </p>
                    <p className="mt-2 text-xl font-semibold text-tertiary">
                      {formatMoney(summary.expenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mb-3 mt-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lançamentos recentes</h2>
              <span className="text-sm text-on-surface-variant">
                {financials.length} registros
              </span>
            </div>
            {financials.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant px-5 text-center">
                <WalletCards
                  className="mb-3 size-7 text-outline"
                  aria-hidden="true"
                />
                <p className="text-sm text-on-surface-variant">
                  Nenhum lançamento neste período.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {financials.map((financial) => (
                  <Card
                    className="border-0 bg-surface-container-lowest shadow-level-1"
                    key={financial.id}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-full ${
                          financial.type === "income"
                            ? "bg-primary-fixed text-primary"
                            : "bg-tertiary-fixed text-tertiary"
                        }`}
                      >
                        <ArrowDown
                          className={`size-4 ${
                            financial.type === "income" ? "-rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {financial.description ||
                            (financial.type === "income"
                              ? "Receita"
                              : "Despesa")}
                        </h3>
                        <p className="mt-1 truncate text-xs text-on-surface-variant">
                          {projectNames.get(financial.projectId) ??
                            "Projeto não encontrado"}{" "}
                          <span aria-hidden="true">•</span>{" "}
                          {formatDate(financial.date)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {financial.type === "income" ? "+" : "-"}
                          {formatMoney(financial.value)}
                        </p>
                        <Badge className="mt-1 rounded-full text-[10px]">
                          {statusLabels[financial.status]}
                        </Badge>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => onEditFinancial(financial)}
                          aria-label="Editar lançamento"
                        >
                          <Edit3 aria-hidden="true" />
                        </Button>
                        <Button
                          className="text-error hover:bg-error-container"
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => setDeletingFinancial(financial)}
                          aria-label="Excluir lançamento"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <button
        className="fixed bottom-20 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 sm:bottom-24 sm:right-8"
        type="button"
        onClick={onCreateFinancial}
        aria-label="Adicionar lançamento"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
      <Dialog
        open={Boolean(deletingFinancial)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingFinancial(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento?</DialogTitle>
            <DialogDescription>
              Essa ação removerá este lançamento permanentemente.
            </DialogDescription>
          </DialogHeader>
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
              {isDeleting ? "Excluindo..." : "Excluir lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default FinancialPage;
