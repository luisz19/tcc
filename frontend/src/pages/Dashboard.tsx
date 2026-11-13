import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardSummary } from "@/api/dashboard";
import type { DashboardSummaryResponse, UpcomingProject } from "@/types/dashboard";
import type { ProjectStatus } from "@/types/projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "../App.css";
import { Card } from "@/components/ui/card";

interface DashboardProps {
  onCreateProject?: () => void;
  onCreateFinancial?: () => void;
  onCreatePackage?: () => void;
  onViewProjects?: () => void;
  onViewProject?: (project: UpcomingProject) => void;
}

type StatusFilter = "all" | ProjectStatus;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

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

function getStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-[#dde1ff] text-[#0040e0]";
    case "in_progress":
      return "bg-[#e7e8e9] text-[#434656]";
    case "pending":
      return "bg-[#fff0d4] text-[#8a5b00]";
    case "completed":
      return "bg-[#dcfce7] text-[#15803d]";
    case "canceled":
      return "bg-[#fee2e2] text-[#b91c1c]";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "confirmed":
      return "Confirmado";
    case "in_progress":
      return "Em Execução";
    case "pending":
      return "Pendente";
    case "completed":
      return "Concluído";
    case "canceled":
      return "Cancelado";
    default:
      return status;
  }
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 401) {
    return "Sua sessão expirou. Entre novamente para visualizar as informações.";
  }
  return "Não foi possível carregar as informações do dashboard agora.";
}

export default function Dashboard({
  onCreateProject,
  onCreateFinancial,
  onCreatePackage,
  onViewProjects,
  onViewProject,
}: DashboardProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      navigate("/projects/new");
    }
  };

  const handleCreateFinancial = () => {
    if (onCreateFinancial) {
      onCreateFinancial();
    } else {
      navigate("/finance/new");
    }
  };

  const handleCreatePackage = () => {
    if (onCreatePackage) {
      onCreatePackage();
    } else {
      navigate("/projects/packages/new");
    }
  };

  const handleViewProjects = () => {
    if (onViewProjects) {
      onViewProjects();
    } else {
      navigate("/projects");
    }
  };

  const handleViewProject = (project: UpcomingProject) => {
    if (onViewProject) {
      onViewProject(project);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getDashboardSummary(selectedMonth, selectedYear)
      .then((result) => {
        if (isMounted) {
          setData(result);
          setErrorMessage("");
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
  }, [selectedMonth, selectedYear, reloadKey]);

  const handlePreviousMonth = () => {
    setIsLoading(true);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setIsLoading(true);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "Usuário";

  const monthName = MONTH_NAMES[selectedMonth - 1] || "";
  const monthShort = MONTH_SHORT_NAMES[selectedMonth - 1] || "";
  const periodLabel = `${monthShort}/${selectedYear}`;

  const upcomingProjects = useMemo(
    () => data?.projects.upcomingProjects ?? [],
    [data]
  );

  // Status counts
  const counts = useMemo(() => {
    const res = {
      all: upcomingProjects.length,
      confirmed: 0,
      in_progress: 0,
      pending: 0,
      completed: 0,
      canceled: 0,
    };
    upcomingProjects.forEach((p) => {
      if (p.status in res) {
        res[p.status as keyof typeof res]++;
      }
    });
    return res;
  }, [upcomingProjects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return upcomingProjects;
    return upcomingProjects.filter((p) => p.status === statusFilter);
  }, [upcomingProjects, statusFilter]);

  const incomePaid = data?.financial.incomePaid ?? 0;
  const expensePaid = data?.financial.expensePaid ?? 0;
  const monthlyResult = data?.financial.monthlyResult ?? 0;

const financialSummary = {
  invoicing: {
    name: "Faturamento Bruto",
    icon: TrendingUp,
    color: "bg-primary-fixed/60 text-primary",
    value: incomePaid,
  },
  balance: {
    name: "Saldo Líquido",
    icon: Wallet,
    color: "bg-surface-container text-primary",
    value: monthlyResult,
  },
  expenses: {
    name: "Despesas Pagas",
    icon: TrendingDown,
    color: "bg-surface-container text-tertiary",
    value: expensePaid,
  }
}

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="mx-auto w-full max-w-2xl px-5 pb-16 pt-8 sm:px-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-on-surface">
              <span>Olá, {firstName}!</span>

            </h1>
            <p className="mt-1 text-xs font-medium text-on-surface-variant">
              Veja como está seu estúdio hoje • {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="size-3.5 rounded-full bg-[#993100] ring-4 ring-[#993100]/20"
              title="Estúdio Ativo"
              aria-label="Status do estúdio"
            />
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex items-center justify-between text-xs">
              <span>{errorMessage}</span>
              {errorMessage.includes("expirou") ? (
                <Button size="sm" variant="ghost" onClick={logout} className="h-7 text-xs">
                  Fazer login
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsLoading(true);
                    setReloadKey((prev) => prev + 1);
                  }}
                  className="h-7 text-xs"
                >
                  Tentar novamente
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleCreateProject}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary py-4 px-2 text-white shadow-level-1 transition hover:bg-primary/90 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="relative">
              <Camera className="size-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex size-3 items-center justify-center text-[10px] font-bold leading-none">
                +
              </span>
            </div>
            <span className="text-xs font-bold tracking-tight">+ Projeto</span>
          </button>

          <button
            type="button"
            onClick={handleCreateFinancial}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest py-4 px-2 text-on-surface shadow-level-1 border border-surface-container transition hover:bg-surface-container-low active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ReceiptText className="size-6 text-primary stroke-[2.2]" />
            <span className="text-xs font-bold tracking-tight text-on-surface">+ Movimento</span>
          </button>

          <button
            type="button"
            onClick={handleCreatePackage}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest py-4 px-2 text-on-surface shadow-level-1 border border-surface-container transition hover:bg-surface-container-low active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Package className="size-6 text-tertiary stroke-[2.2]" />
            <span className="text-xs font-bold tracking-tight text-on-surface">+ Pacote</span>
          </button>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">Resumo Financeiro</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePreviousMonth}
                aria-label="Mês anterior"
                className="grid size-6 place-items-center rounded text-outline hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-xs font-bold tracking-wider text-outline uppercase select-none">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
                className="grid size-6 place-items-center rounded text-outline hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-3.5 overflow-x-auto pb-2 scrollbar-none sm:gap-26 sm:grid sm:grid-cols-3">
            {Object.values(financialSummary).map((item) => (
              <Card className="min-w-[260px] h-[100px]  flex-row p-5 " key={item.name}>
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "grid size-9 place-items-center rounded-xl",
                    item.color
                  )}>
                    <item.icon className="size-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center">
                  <span className="text-xs font-medium text-on-surface-variant">
                    {item.name}
                  </span>
                  <p className="text-2xl font-bold tracking-tight text-on-surface">
                    {isLoading ? "..." : formatMoney(item.value)}
                  </p>
                  {item.name === "Faturamento Bruto" && (
                  <p className="mt-1 text-[11px] text-outline">
                    vs. mês anterior ({formatMoney(incomePaid * 0.875)})
                  </p>
                  )}
                  
                </div>
            </Card>
            ))}
          </div>
        </div>

        {/* Section: Próximos Trabalhos */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">Próximos Trabalhos</h2>
            <button
              type="button"
              onClick={handleViewProjects}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Ver agenda
            </button>
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                statusFilter === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              Todos ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("confirmed")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                statusFilter === "confirmed"
                  ? "bg-primary text-white shadow-sm"
                  : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              Confirmados ({counts.confirmed})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("in_progress")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                statusFilter === "in_progress"
                  ? "bg-primary text-white shadow-sm"
                  : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              Em Execução ({counts.in_progress})
            </button>

            {counts.pending > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                  statusFilter === "pending"
                    ? "bg-primary text-white shadow-sm"
                    : "border border-surface-container bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                )}
              >
                Pendentes ({counts.pending})
              </button>
            )}
          </div>

          {/* Project List */}
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <LoaderCircle className="size-6 animate-spin text-primary" />
                <p className="mt-3 text-xs font-medium">Carregando informações...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container bg-surface-container-lowest/50 py-10 px-4 text-center">
                <p className="text-xs font-medium text-on-surface-variant">
                  {statusFilter === "all"
                    ? "Nenhum trabalho agendado para este período."
                    : `Nenhum trabalho com status "${getStatusLabel(statusFilter)}".`}
                </p>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Novo Projeto</span>
                </button>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleViewProject(project)}
                  className="group rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-level-1 transition hover:shadow-level-2 hover:border-outline-variant/60 cursor-pointer"
                >
                  {/* Top Row: Type/Title uppercase & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {project.title}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                        getStatusBadgeClass(project.status)
                      )}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {/* Client Name */}
                  <h3 className="mt-1 text-base font-bold text-on-surface">
                    {project.clientName}
                  </h3>

                  {/* Date & Time with optional detail */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Calendar className="size-3.5 text-outline shrink-0" />
                    <span>
                      {formatProjectDateTime(project.startAt)}
                      {project.notes ? ` (${project.notes})` : ""}
                    </span>
                  </div>

                  {/* Bottom Row: Location or Details on Left, Agreed Price on Right */}
                  <div className="mt-3 flex items-center justify-between border-t border-surface-container/60 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <MapPin className="size-3.5 text-outline shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {project.local || "Local a combinar"}
                      </span>
                    </div>

                    {project.agreed_price !== null && project.agreed_price !== undefined ? (
                      <span className="text-sm font-bold text-on-surface">
                        {formatMoney(project.agreed_price)}
                      </span>
                    ) : (
                      <span className="text-xs text-primary font-medium group-hover:underline">
                        Ver detalhes
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
