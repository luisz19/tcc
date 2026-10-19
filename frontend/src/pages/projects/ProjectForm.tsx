import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, DollarSign, LoaderCircle, MapPin, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getClients } from '@/api/clients'
import { getPackages } from '@/api/package'
import { createProject, updateProject, type ProjectPayload } from '@/api/project'
import type { Client } from '@/types/clients'
import { projectTypes, type Project, type ProjectType } from '@/types/projects'
import type { Package } from '@/types/packages'
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
	projectType: z.enum(projectTypes),
	title: z.string().trim().min(2, 'Informe o título do projeto.'),
	packageId: z.string().trim().nullable(),
	local: z.string().trim().nullable(),
	startAt: z.string(),
	endAt: z.string(),
	notes: z.string().trim(),
	agreed_price: z.string().refine((value) => !value || Number(value) >= 0, 'Informe um valor válido.'),
})

type ProjectFormData = z.infer<typeof projectSchema>

function getLocalDateTimeInput(value?: string | null) {
	if (!value) {
		return ''
	}

	const date = new Date(value)
	const pad = (part: number) => String(part).padStart(2, '0')

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoDateTime(value: string) {
	return value ? new Date(value).toISOString() : undefined
}

function ProjectForm({ project, onCancel, onSaved }: ProjectFormProps) {
	const isEditing = Boolean(project)
	const [clients, setClients] = useState<Client[]>([])
	const [packages, setPackages] = useState<Package[]>([])
	const [isLoadingOptions, setIsLoadingOptions] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')
	const { register, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			clientId: project?.clientId ?? '',
			projectType: project?.projectType ?? 'photo_session',
			title: project?.title ?? '',
			packageId: project?.packageId ?? '',
			local: project?.local ?? '',
			startAt: getLocalDateTimeInput(project?.startAt),
			endAt: getLocalDateTimeInput(project?.endAt),
			notes: project?.notes ?? '',
			agreed_price: project?.agreed_price === null ? '' : String(project?.agreed_price ?? ''),
		},
	})

	useEffect(() => {
		let isMounted = true

		void Promise.all([getClients(), getPackages()])
			.then(([clientData, packageData]) => {
				if (isMounted) {
					setClients(clientData)
					setPackages(packageData)
					if (project?.clientId) {
						setValue('clientId', project.clientId)
					}
					if (project?.packageId) {
						setValue('packageId', project.packageId)
					}
				}
			})
			.catch(() => {
				if (isMounted) {
					setErrorMessage('Não foi possível carregar os clientes e pacotes.')
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoadingOptions(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [project?.clientId, project?.packageId, setValue])

	async function onSubmit(data: ProjectFormData) {
		setErrorMessage('')
		if (Boolean(data.startAt) !== Boolean(data.endAt)) {
			setErrorMessage('Informe data e hora de início e fim juntas.')
			return
		}

		const payload: ProjectPayload = {
			clientId: data.clientId,
			projectType: data.projectType as ProjectType,
			packageId: data.packageId || undefined,
			title: data.title,
			local: data.local || undefined,
			startAt: toIsoDateTime(data.startAt),
			endAt: toIsoDateTime(data.endAt),
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
			setErrorMessage(isAxiosError(error) && error.response?.data?.code === 'PROJECT_SCHEDULE_CONFLICT'
				? 'O período escolhido se sobrepõe a outro projeto. Escolha outro horário.'
				: isAxiosError(error) && error.response?.status === 409
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
							<UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
							<select className="h-12 w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" id="project-client" disabled={isLoadingOptions} aria-invalid={Boolean(errors.clientId)} {...register('clientId')}>
								<option value="">{isLoadingOptions ? 'Carregando clientes...' : 'Selecione um cliente'}</option>
								{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
							</select>
						</div>
						{errors.clientId && <p className="text-xs text-error">{errors.clientId.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-package">Pacote</Label>
						<div className="relative">
							<BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
							<select className="h-12 w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" id="project-package" disabled={isLoadingOptions} aria-invalid={Boolean(errors.packageId)} {...register('packageId')}>
								<option value="">{isLoadingOptions ? 'Carregando pacotes...' : 'Nenhum pacote selecionado'}</option>
								{packages.map((packageItem) => <option value={packageItem.id} key={packageItem.id}>{packageItem.name}</option>)}
							</select>
						</div>
						{errors.packageId && <p className="text-xs text-error">{errors.packageId.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-type">Tipo de projeto <span className="text-error">*</span></Label>
						<select className="h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" id="project-type" aria-invalid={Boolean(errors.projectType)} {...register('projectType')}>
							<option value="">Selecione o tipo de projeto</option>
							<option value="event">Evento</option>
							<option value="photo_session">Sessão de fotos</option>
						</select>
						{errors.projectType && <p className="text-xs text-error">Selecione o tipo de projeto.</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-title">Título <span className="text-error">*</span></Label>
						<Input id="project-title" placeholder="Ex.: Campanha de verão" aria-invalid={Boolean(errors.title)} {...register('title')} />
						{errors.title && <p className="text-xs text-error">{errors.title.message}</p>}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="project-start-at">Início</Label>
							<div className="relative">
								<CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
								<Input className="pl-10" id="project-start-at" type="datetime-local" aria-invalid={Boolean(errors.startAt)} {...register('startAt')} />
							</div>
							{errors.startAt && <p className="text-xs text-error">{errors.startAt.message}</p>}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="project-end-at">Fim</Label>
							<div className="relative">
								<CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
								<Input className="pl-10" id="project-end-at" type="datetime-local" aria-invalid={Boolean(errors.endAt)} {...register('endAt')} />
							</div>
							{errors.endAt && <p className="text-xs text-error">{errors.endAt.message}</p>}
						</div>
						<div className="grid gap-2 sm:col-span-2">
							<Label htmlFor="project-price">Valor combinado</Label>
							<div className="relative">
								<DollarSign className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
								<Input className="pl-10" id="project-price" type="number" min="0" step="0.01" placeholder="0,00" aria-invalid={Boolean(errors.agreed_price)} {...register('agreed_price')} />
							</div>
							{errors.agreed_price && <p className="text-xs text-error">{errors.agreed_price.message}</p>}
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="project-local">Local</Label>
						<div className="relative">
							<MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-4.25 -translate-y-1/2 text-outline" aria-hidden="true" />
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
						<Button className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-36" type="submit" disabled={isSubmitting || isLoadingOptions}>
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
