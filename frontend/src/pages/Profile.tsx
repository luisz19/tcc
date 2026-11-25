import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  IdCard,
  Pencil,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile, deleteProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUserData } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(!user);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((profile) => {
        if (!isMounted) return;
        setName(profile.name);
        setEmail(profile.email);
        updateUserData?.(profile);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        const msg = error instanceof Error ? error.message : "Erro ao carregar dados do perfil.";
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [updateUserData]);

  const hasChanges =
    name.trim() !== (user?.name || "").trim() ||
    email.trim().toLowerCase() !== (user?.email || "").trim().toLowerCase();

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("O nome não pode ficar vazio.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      updateUserData?.(updated);
      setName(updated.name);
      setEmail(updated.email);
      setSuccessMessage("Informações atualizadas com sucesso!");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Erro ao atualizar perfil.");
      setErrorMessage(
        Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErrorMessage(null);
    setIsDeleting(true);

    try {
      await deleteProfile();
      logout();
      navigate("/login");
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Erro ao excluir conta.");
      setDeleteErrorMessage(
        Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage
      );
      setIsDeleting(false);
    }
  };

  const initials = getInitials(name || user?.name);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pt-4 pb-28 sm:px-6">
      <section className="mt-12 flex flex-col items-center text-center">
        <div className="relative grid size-24 place-items-center rounded-2xl bg-primary/10 text-primary">
          <span className="text-2xl font-bold tracking-tight text-primary">
            {initials}
          </span>

        </div>

        <h2 className="mt-3 text-xl font-bold text-on-surface">
          {isLoading ? "Carregando..." : name || user?.name || "Usuário"}
        </h2>

      </section>

      <Card className="mt-6 rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <IdCard className="size-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-bold text-on-surface">
            Informações da Conta
          </h3>
        </div>

        <form onSubmit={handleSaveChanges} className="mt-4 flex flex-col gap-4">
          <div>
            <label
              htmlFor="profile-name"
              className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              NOME COMPLETO
            </label>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              disabled={isLoading || isSaving}
              className="mt-1.5 h-11 rounded-xl border-transparent bg-surface-container/40 px-3 text-sm font-medium focus-visible:bg-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              E-MAIL
            </label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              disabled={isLoading || isSaving}
              className="mt-1.5 h-11 rounded-xl border-transparent bg-surface-container/40 px-3 text-sm font-medium focus-visible:bg-transparent"
            />
          </div>

          {errorMessage && (
            <Alert
              variant="destructive"
              className="border-error/25 bg-error-container text-on-error-container"
            >
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isSaving || isLoading || !hasChanges}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-xs hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
          >
            <Save className="size-4" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </Card>

      <div className="mt-4 rounded-2xl border border-red-200/60 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold">Excluir Conta</h3>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setDeleteErrorMessage(null);
            setIsDeleteDialogOpen(true);
          }}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-100 text-sm font-semibold text-red-700 hover:bg-red-200 active:scale-[0.99] dark:bg-red-900/30 dark:text-red-300 cursor-pointer"
        >
          <Trash2 className="size-4" />
          Excluir Conta
        </Button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/home")}
        className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface cursor-pointer mx-auto"
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao Início
      </button>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
            <DialogDescription>
              A exclusão é irreversível. Todos os seus dados de perfil,
              histórico operacional, projetos, clientes e movimentações
              financeiras serão apagados permanentemente. Deseja realmente
              excluir sua conta?
            </DialogDescription>
          </DialogHeader>

          {deleteErrorMessage && (
            <Alert
              variant="destructive"
              className="border-error/25 bg-error-container text-on-error-container"
            >
              <AlertDescription>{deleteErrorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant="outline"
                  type="button"
                  disabled={isDeleting}
                />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default Profile;
