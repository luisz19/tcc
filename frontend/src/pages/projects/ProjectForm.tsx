import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CalendarDays, DollarSign, LoaderCircle, MapPin, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getClients } from '@/api/clients'
import { createProject, updateProject, type ProjectPayload } from '@/api/project'
import type { Client } from '@/types/clients'
import type { Project } from '@/types/projects'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import '../../App.css'

interface ProjectFormProps {
	project?: Project
	onCancel: () => void
	onSaved: () => void
}

const projectSchema = z.object({
	clientId: z.string().min(1, 'Selecione um cliente.'),
	title: z.string().trim().min(2, 'Informe o título do projeto.'),
    status: z.string().trim(),
	local: z.string().trim(),
	date: z.string(),
	notes: z.string().trim(),
	agreed_price: z.string().refine((value) => !value || Number(value) >= 0, 'Informe um valor válido.'),
})

type ProjectFormData = z.infer<typeof projectSchema>

function ProjectForm({ project, onCancel, onSaved }: ProjectFormProps) {
	const isEditing = Boolean(project)
	const [clients, setClients] = useState<Client[]>([])
	const [isLoadingClients, setIsLoadingClients] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')
	const { register, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			clientId: project?.clientId ?? '',
			title: project?.title ?? '',
			local: project?.local ?? '',
			date: project?.date ?? '',
			notes: project?.notes ?? '',
			agreed_price: project?.agreed_price === null ? '' : String(project?.agreed_price ?? ''),
		},
	})

	useEffect(() => {
		let isMounted = true

		void getClients()
			.then((data) => {
				if (isMounted) {
					setClients(data)
					if (project?.clientId) {
						setValue('clientId', project.clientId)
					}
				}
			})
			.catch(() => {
				if (isMounted) {
					setErrorMessage('Não foi possível carregar os clientes.')
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoadingClients(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [project?.clientId, setValue])

	async function onSubmit(data: ProjectFormData) {
		setErrorMessage('')
		const payload: ProjectPayload = {
			clientId: data.clientId,
			title: data.title,
			local: data.local || undefined,
			date: data.date || undefined,
			notes: data.notes || undefined,
			agreed_price: data.agreed_price ? Number(data.agreed_price) : undefined,
		}

		try {
			if (project) {
				await updateProject(project.id, payload)
			} else {
				await createProject(payload)
			}
			onSaved()
		} catch (error) {
			setErrorMessage(isAxiosError(error) && error.response?.status === 409
				? 'Já existe um projeto com esse título.'
				: `Não foi possível ${isEditing ? 'atualizar' : 'cadastrar'} o projeto agora.`)
		}
	}

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-5 sm:px-8">
					<Button className="size-10 rounded-full text-on-surface-variant hover:bg-surface-container" variant="ghost" size="icon" type="button" onClick={onCancel} aria-label="Voltar para projetos">
						<ArrowLeft aria-hidden="true" />
					</Button>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-label text-primary">Aperture Operations</p>
						<h1 className="text-lg font-semibold text-on-surface">{isEditing ? 'Editar projeto' : 'Novo projeto'}</h1>
					</div>
				</div>
			</header>

			<section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
				<div className="mb-6">
					<h2 className="text-2xl font-semibold leading-8 text-on-surface">Informações do projeto</h2>
					<p className="mt-1 text-sm leading-6 text-on-surface-variant">Organize os detalhes do trabalho e mantenha o acompanhamento atualizado.</p>
				</div>

				<form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<Label htmlFor="project-client">Cliente <span className="text-error">*</span></Label>
						<div className="relative">
							<UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<select className="h-12 w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" id="project-client" disabled={isLoadingClients} aria-invalid={Boolean(errors.clientId)} {...register('clientId')}>
								<option value="">{isLoadingClients ? 'Carregando clientes...' : 'Selecione um cliente'}</option>
								{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
							</select>
						</div>
						{errors.clientId && <p className="text-xs text-error">{errors.clientId.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-title">Título <span className="text-error">*</span></Label>
						<Input id="project-title" placeholder="Ex.: Campanha de verão" aria-invalid={Boolean(errors.title)} {...register('title')} />
						{errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
					</div>

					<div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
						<div className="grid gap-2">
							<Label htmlFor="project-date">Data</Label>
							<div className="relative">
								<CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
								<Input className="pl-10" id="project-date" type="date" {...register('date')} />
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="project-price">Valor combinado</Label>
							<div className="relative">
								<DollarSign className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
								<Input className="pl-10" id="project-price" type="number" min="0" step="0.01" placeholder="0,00" aria-invalid={Boolean(errors.agreed_price)} {...register('agreed_price')} />
							</div>
							{errors.agreed_price && <p className="text-xs text-error">{errors.agreed_price.message}</p>}
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-local">Local</Label>
						<div className="relative">
							<MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="pl-10" id="project-local" placeholder="Rua, cidade ou estúdio" {...register('local')} />
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-notes">Observações</Label>
						<textarea className="min-h-28 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-3 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-3 focus:ring-primary/15" id="project-notes" placeholder="Anotações importantes sobre o projeto" {...register('notes')} />
					</div>

					{errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}

					<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
						<Button className="h-12 sm:min-w-28" variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
						<Button className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-36" type="submit" disabled={isSubmitting || isLoadingClients}>
							{isSubmitting && <LoaderCircle className="animate-login-spin size-4" aria-hidden="true" />}
							{isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar projeto'}
						</Button>
					</div>
				</form>
			</section>
		</main>
	)
}

export default ProjectForm
