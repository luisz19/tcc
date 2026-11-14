import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowDown,
  Calendar,
  Edit3,
  LoaderCircle,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
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
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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

const financialStatusBadgeClasses: Record<FinancialStatus, string> = {
  paid: "bg-[#dcfce7] text-[#15803d]",
  pending: "bg-[#fff0d4] text-[#8a5b00]",
  canceled: "bg-[#fee2e2] text-[#b91c1c]",
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
      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold leading-8 text-on-surface">
              Suas finanças
            </h2>
          </div>
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
            <Card className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-level-1 ring-0 gap-0 my-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Resumo Geral
              </span>
              <p className="mt-1 text-xs font-medium text-on-surface-variant">
                Total de receitas
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-on-surface">
                {formatMoney(totalRevenue)}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Recebido
                  </span>
                  <p className="mt-1 text-base font-bold text-primary">
                    {formatMoney(summary.received)}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Pendente
                  </span>
                  <p className="mt-1 text-base font-bold text-on-surface">
                    {formatMoney(summary.pending)}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Despesas
                  </span>
                  <p className="mt-1 text-base font-bold text-tertiary">
                    {formatMoney(summary.expenses)}
                  </p>
                </div>
              </div>
            </Card>

            <div
              className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
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
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    period === value
                      ? "bg-primary text-white shadow-sm"
                      : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  )}
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

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Lançamentos recentes</h2>
              <span className="text-xs font-medium text-on-surface-variant">
                {financials.length} {financials.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {financials.length === 0 ? (
              <Card className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-dashed border-surface-container bg-surface-container-lowest/50 px-6 py-10 text-center ring-0 gap-0">
                <WalletCards
                  className="mb-3 size-7 text-outline"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-on-surface">
                  Nenhum lançamento encontrado
                </h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">
                  Não há movimentações financeiras registradas para este período.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {financials.map((financial) => (
                  <Card
                    key={financial.id}
                    className="group rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-level-1 ring-0 gap-0 transition hover:border-outline-variant/60 hover:shadow-level-2"
                  >
             
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "grid size-6 place-items-center rounded-lg",
                            financial.type === "income"
                              ? "bg-primary-fixed/60 text-primary"
                              : "bg-[#fee2e2] text-[#b91c1c]"
                          )}
                        >
                          <ArrowDown
                            className={cn(
                              "size-3.5 stroke-[2.5]",
                              financial.type === "income" ? "-rotate-180" : ""
                            )}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          {financial.type === "income" ? "RECEITA" : "DESPESA"}
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border-0 shadow-none hover:opacity-90",
                          financialStatusBadgeClasses[financial.status]
                        )}
                      >
                        {statusLabels[financial.status]}
                      </Badge>
                    </div>

               
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h3 className="truncate text-base font-bold text-on-surface">
                        {financial.description ||
                          (financial.type === "income" ? "Receita" : "Despesa")}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 text-base font-bold tracking-tight",
                          financial.type === "income"
                            ? "text-primary"
                            : "text-[#b91c1c]"
                        )}
                      >
                        {financial.type === "income" ? "+" : "-"}
                        {formatMoney(financial.value)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {projectNames.get(financial.projectId) ??
                        "Sem projeto associado"}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-surface-container/60 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Calendar className="size-3.5 text-outline shrink-0" />
                        <span>{formatDate(financial.date)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditFinancial(financial)}
                          className="grid size-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
                          aria-label="Editar lançamento"
                          title="Editar lançamento"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFinancial(financial)}
                          className="grid size-7 place-items-center rounded-lg text-error hover:bg-error-container transition cursor-pointer"
                          aria-label="Excluir lançamento"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <button
        className="fixed bottom-6 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 transition-transform hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:bottom-8 sm:right-8 cursor-pointer"
        type="button"
        onClick={onCreateFinancial}
        aria-label="Adicionar lançamento"
        title="Adicionar lançamento"
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
