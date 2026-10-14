import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  LoaderCircle,
  PackageOpen,
  Plus,
  X,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createPackage,
  updatePackage,
  type PackagePayload,
} from "@/api/package";
import { getProjects, updateProject } from "@/api/project";
import type { Package } from "@/types/packages";
import type { Project } from "@/types/projects";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "../../App.css";

interface PackageFormProps {
  packageItem?: Package;
  onCancel: () => void;
  onSaved: () => void;
}

const packageSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do pacote."),
  description: z.string().trim(),
  base_price: z
    .string()
    .refine((value) => Number(value) >= 0, "Informe um preço válido."),
});

type PackageFormData = z.infer<typeof packageSchema>;

function PackageForm({ packageItem, onCancel, onSaved }: PackageFormProps) {
  const isEditing = Boolean(packageItem);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [availableProjectId, setAvailableProjectId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: packageItem?.name ?? "",
      description: packageItem?.description ?? "",
      base_price: packageItem ? String(packageItem.base_price) : "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    void getProjects()
      .then((data) => {
        if (isMounted) {
          setProjects(data);
          if (packageItem) {
            setSelectedProjectIds(
              data
                .filter((project) => project.packageId === packageItem.id)
                .map((project) => project.id)
            );
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar os projetos.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [packageItem]);

  const availableProjects = useMemo(
    () =>
      projects.filter((project) => !selectedProjectIds.includes(project.id)),
    [projects, selectedProjectIds]
  );

  function addProject() {
    if (!availableProjectId) {
      return;
    }

    setSelectedProjectIds((currentIds) => [...currentIds, availableProjectId]);
    setAvailableProjectId("");
  }

  function removeProject(projectId: string) {
    setSelectedProjectIds((currentIds) =>
      currentIds.filter((id) => id !== projectId)
    );
  }

  async function onSubmit(data: PackageFormData) {
    setErrorMessage("");
    const payload: PackagePayload = {
      name: data.name,
      description: data.description || undefined,
      base_price: Number(data.base_price),
    };

    try {
      const savedPackage = packageItem
        ? await updatePackage(packageItem.id, payload)
        : await createPackage(payload);
      const previousProjectIds = projects
        .filter((project) => project.packageId === savedPackage.id)
        .map((project) => project.id);
      const projectsToLink = projects.filter(
        (project) =>
          selectedProjectIds.includes(project.id) &&
          project.packageId !== savedPackage.id
      );
      const projectsToUnlink = projects.filter(
        (project) =>
          previousProjectIds.includes(project.id) &&
          !selectedProjectIds.includes(project.id)
      );

      await Promise.all([
        ...projectsToLink.map((project) =>
          updateProject(project.id, { packageId: savedPackage.id })
        ),
        ...projectsToUnlink.map((project) =>
          updateProject(project.id, { packageId: null })
        ),
      ]);
      onSaved();
    } catch (error) {
      setErrorMessage(
        isAxiosError(error) && error.response?.status === 409
          ? "Já existe um pacote com esse nome."
          : `Não foi possível ${
              isEditing ? "atualizar" : "cadastrar"
            } o pacote agora.`
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
            aria-label="Voltar para pacotes"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-label text-primary">
              Projetos
            </p>
            <h1 className="text-lg font-semibold">
              {isEditing ? "Editar pacote" : "Novo pacote"}
            </h1>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl space-y-4 px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <Card className="border-0 bg-surface-container-lowest shadow-level-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="size-5 text-primary" aria-hidden="true" />
              Dados base
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="package-name">
                Título do pacote <span className="text-error">*</span>
              </Label>
              <Input
                id="package-name"
                placeholder="Ex.: Cobertura Editorial Essencial"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-error">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package-description">Descrição</Label>
              <textarea
                className="min-h-20 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-3 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-3 focus:ring-primary/15"
                id="package-description"
                placeholder="Descreva o que está incluído no pacote"
                {...register("description")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package-price">
                Preço base recomendado <span className="text-error">*</span>
              </Label>
              <div className="relative">
                <DollarSign
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline"
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  id="package-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  aria-invalid={Boolean(errors.base_price)}
                  {...register("base_price")}
                />
              </div>
              {errors.base_price && (
                <p className="text-xs text-error">
                  {errors.base_price.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-container-lowest shadow-level-1">
          <CardHeader>
            <CardTitle>Vincular a projetos</CardTitle>
            <p className="text-sm text-on-surface-variant">
              Associe este pacote aos projetos que utilizarão seus valores.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="package-project">
                Adicionar projeto da lista
              </Label>
              <div className="flex gap-2">
                <select
                  className="h-11 min-w-0 flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  id="package-project"
                  value={availableProjectId}
                  onChange={(event) =>
                    setAvailableProjectId(event.target.value)
                  }
                  disabled={isLoadingProjects || availableProjects.length === 0}
                >
                  <option value="">
                    {isLoadingProjects
                      ? "Carregando projetos..."
                      : availableProjects.length
                      ? "Escolha um projeto ativo..."
                      : "Todos os projetos já foram adicionados"}
                  </option>
                  {availableProjects.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="icon"
                  onClick={addProject}
                  disabled={!availableProjectId}
                  aria-label="Adicionar projeto"
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-[11px] font-bold uppercase tracking-label text-on-surface-variant">
                Projetos vinculados ({selectedProjectIds.length})
              </p>
              {selectedProjectIds.length === 0 ? (
                <p className="rounded-md bg-surface-container px-3 py-3 text-sm text-on-surface-variant">
                  Nenhum projeto vinculado.
                </p>
              ) : (
                selectedProjectIds.map((projectId) => {
                  const project = projects.find(({ id }) => id === projectId);
                  return (
                    <div
                      className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-medium text-on-primary"
                      key={projectId}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {project?.title ?? "Projeto não encontrado"}
                      </span>
                      <button
                        className="grid size-5 place-items-center rounded-full hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/50"
                        type="button"
                        onClick={() => removeProject(projectId)}
                        aria-label={`Remover ${project?.title ?? "projeto"}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <Alert
            variant="destructive"
            className="border-error/25 bg-error-container text-on-error-container"
          >
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            className="h-12 sm:min-w-28"
            variant="outline"
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-40"
            type="button"
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={isSubmitting || isLoadingProjects}
          >
            {isSubmitting && (
              <LoaderCircle
                className="animate-login-spin size-4"
                aria-hidden="true"
              />
            )}
            {isSubmitting ? (
              "Salvando..."
            ) : (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Salvar pacote
              </>
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}

export default PackageForm;
