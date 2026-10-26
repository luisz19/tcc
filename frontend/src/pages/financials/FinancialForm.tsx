import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  FolderKanban,
  LoaderCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createFinancial, updateFinancial } from "@/api/financial";
import { getProjects } from "@/api/project";
import {
  financialStatuses,
  financialTypes,
  type Financial,
  type FinancialPayload,
  type FinancialStatus,
  type FinancialType,
} from "@/types/financial";
import type { Project } from "@/types/projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "../../App.css";

interface FinancialFormProps {
  financial?: Financial;
  onCancel: () => void;
  onSaved: () => void;
}

const financialSchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto."),
  type: z.enum(financialTypes),
  status: z.enum(financialStatuses),
  description: z.string().trim(),
  value: z
    .string()
    .refine((value) => Number(value) > 0, "Informe um valor maior que zero."),
  date: z.string().min(1, "Informe a data."),
});

type FinancialFormData = z.infer<typeof financialSchema>;

function FinancialForm({ financial, onCancel, onSaved }: FinancialFormProps) {
  const location = useLocation();
  const locationState = location.state as
    | {
        projectId?: string;
        projectTitle?: string;
        fromProject?: boolean;
        fromProjectId?: string;
      }
    | undefined;

  const defaultProjectId =
    financial?.projectId ?? locationState?.projectId ?? "";
  const hasProjectId = Boolean(defaultProjectId);
  const isEditing = Boolean(financial);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(!hasProjectId);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      projectId: defaultProjectId,
      type: financial?.type ?? "income",
      status: financial?.status ?? "pending",
      description: financial?.description ?? "",
      value: financial ? String(financial.value) : "",
      date:
        financial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (defaultProjectId) {
      setValue("projectId", defaultProjectId, { shouldValidate: true });
    }
  }, [defaultProjectId, setValue]);

  useEffect(() => {
    let isMounted = true;
    void getProjects()
      .then((data) => {
        if (isMounted) setProjects(data);
      })
      .catch(() => {
        if (isMounted && !hasProjectId)
          setErrorMessage("Não foi possível carregar os projetos.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingProjects(false);
      });
    return () => {
      isMounted = false;
    };
  }, [hasProjectId]);

  const selectedProject = projects.find(
    (project) => project.id === defaultProjectId
  );
  const projectTitle =
    locationState?.projectTitle ??
    selectedProject?.title ??
    (isLoadingProjects ? "Carregando projeto..." : "Projeto vinculado");

  async function onSubmit(data: FinancialFormData) {
    setErrorMessage("");
    const payload: FinancialPayload = {
      projectId: data.projectId,
      type: data.type as FinancialType,
      status: data.status as FinancialStatus,
      description: data.description || undefined,
      value: Number(data.value),
      date: data.date,
    };

    try {
      if (financial) await updateFinancial(financial.id, payload);
      else await createFinancial(payload);
      onSaved();
    } catch (error) {
      setErrorMessage(
        isAxiosError(error) && error.response?.status === 404
          ? "O projeto selecionado não foi encontrado."
          : `Não foi possível ${
              isEditing ? "atualizar" : "cadastrar"
            } o lançamento agora.`
      );
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
            onClick={onCancel}
            aria-label="Voltar"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-label text-primary">
              Aperture Operations
            </p>
            <h1 className="text-lg font-semibold">
              {isEditing ? "Editar lançamento" : "Novo lançamento"}
            </h1>
          </div>
        </div>
      </header>
      <section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold leading-8">
            Dados do lançamento
          </h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            Registre recebimentos e despesas vinculados aos seus projetos.
          </p>
        </div>
        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          {hasProjectId ? (
            <div className="grid gap-2">
              <Label htmlFor="financial-project-display">Projeto</Label>
              <div
                id="financial-project-display"
                className="flex h-12 w-full items-center justify-between rounded-md border border-outline-variant bg-surface-container-low px-3.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FolderKanban
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-on-surface">
                    {projectTitle}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                  Vinculado
                </span>
              </div>
              <input
                type="hidden"
                {...register("projectId")}
                value={defaultProjectId}
              />
              {errors.projectId && (
                <p className="text-xs text-error">{errors.projectId.message}</p>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="financial-project">
                Projeto <span className="text-error">*</span>
              </Label>
              <select
                className="h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                id="financial-project"
                disabled={isLoadingProjects}
                aria-invalid={Boolean(errors.projectId)}
                {...register("projectId")}
              >
                <option value="">
                  {isLoadingProjects
                    ? "Carregando projetos..."
                    : "Selecione um projeto"}
                </option>
                {projects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-xs text-error">{errors.projectId.message}</p>
              )}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="financial-type">Tipo</Label>
              <select
                className="h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                id="financial-type"
                {...register("type")}
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="financial-status">Status</Label>
              <select
                className="h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                id="financial-status"
                {...register("status")}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="financial-description">Descrição</Label>
            <Input
              id="financial-description"
              placeholder="Ex.: Pagamento final do ensaio"
              {...register("description")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="financial-value">
                Valor <span className="text-error">*</span>
              </Label>
              <div className="relative">
                <DollarSign
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline"
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  id="financial-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  aria-invalid={Boolean(errors.value)}
                  {...register("value")}
                />
              </div>
              {errors.value && (
                <p className="text-xs text-error">{errors.value.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="financial-date">
                Data <span className="text-error">*</span>
              </Label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline"
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  id="financial-date"
                  type="date"
                  {...register("date")}
                />
              </div>
              {errors.date && (
                <p className="text-xs text-error">{errors.date.message}</p>
              )}
            </div>
          </div>
          {errorMessage && (
            <Alert
              variant="destructive"
              className="border-error/25 bg-error-container text-on-error-container"
            >
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              className="h-12 sm:min-w-28"
              variant="outline"
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-36"
              type="submit"
              disabled={isSubmitting || (!hasProjectId && isLoadingProjects)}
            >
              {isSubmitting && (
                <LoaderCircle
                  className="animate-login-spin size-4"
                  aria-hidden="true"
                />
              )}
              {isSubmitting
                ? "Salvando..."
                : isEditing
                ? "Salvar alterações"
                : "Salvar lançamento"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default FinancialForm;
