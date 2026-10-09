import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { CalendarDays, CircleDollarSign, LoaderCircle, MapPin, Pencil, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { getClients } from '@/api/clients'
import { getProjects } from '@/api/project'
import { deleteProject } from '@/api/project'
import type { Client } from '@/types/clients'
import { projectStatuses, type Project, type ProjectStatus } from '@/types/projects'
import SearchInput from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import '../App.css'

interface ProjectsProps {
	onCreateProject: () => void
	onEditProject: (project: Project) => void
	onOpenClients: () => void
}

type StatusFilter = 'all' | ProjectStatus

const statusLabels: Record<ProjectStatus, string> = {
	pending: 'Pendente',
	confirmed: 'Confirmado',
	in_progress: 'Em andamento',
	completed: 'Concluído',
	canceled: 'Cancelado',
}

const statusClasses: Record<ProjectStatus, string> = {
	pending: 'bg-surface-container text-on-surface-variant',
	confirmed: 'bg-primary-fixed text-on-primary-fixed',
	in_progress: 'bg-primary-fixed text-on-primary-fixed',
	completed: 'bg-surface-container-high text-on-surface-variant',
	canceled: 'bg-error-container text-on-error-container',
}

function formatDate(date: string | null) {
	if (!date) {
		return 'Data não informada'
	}

	const [year, month, day] = date.split('-').map(Number)
	return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day))
}

function formatPrice(price: number | string | null) {
	if (price === null || price === '') {
		return 'Valor não informado'
	}

	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price))
}

function getErrorMessage(error: unknown) {
	return isAxiosError(error) && error.response?.status === 401
		? 'Sua sessão expirou. Entre novamente para visualizar os projetos.'
		: 'Não foi possível carregar os projetos agora.'
}

function Projects({ onCreateProject, onEditProject, onOpenClients }: ProjectsProps) {
	const { logout } = useAuth()
	const [projects, setProjects] = useState<Project[]>([])
	const [clients, setClients] = useState<Client[]>([])
	const [search, setSearch] = useState('')
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [isLoading, setIsLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')
	const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		void Promise.all([getProjects(), getClients()])
			.then(([projectData, clientData]) => {
				if (isMounted) {
					setProjects(projectData)
					setClients(clientData)
				}
			})
			.catch((error: unknown) => {
				if (isMounted) {
					setErrorMessage(getErrorMessage(error))
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [])

	async function handleDelete(project: Project) {
		if (!window.confirm(`Excluir o projeto "${project.title}"?`)) {
			return
		}

		setErrorMessage('')
		setDeletingProjectId(project.id)

		try {
			await deleteProject(project.id)
			setProjects((currentProjects) => currentProjects.filter(({ id }) => id !== project.id))
		} catch (error) {
			setErrorMessage(isAxiosError(error) && error.response?.status === 404
				? 'Esse projeto não foi encontrado.'
				: 'Não foi possível excluir o projeto agora.')
		} finally {
			setDeletingProjectId(null)
		}
	}

	const clientNames = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients])
	const filteredProjects = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()

		return projects.filter((project) => {
			const matchesStatus = statusFilter === 'all' || project.status === statusFilter
			const clientName = clientNames.get(project.clientId) ?? ''
			const matchesSearch = !normalizedSearch || [project.title, project.local ?? '', clientName]
				.some((value) => value.toLowerCase().includes(normalizedSearch))

			return matchesStatus && matchesSearch
		})
	}, [clientNames, projects, search, statusFilter])

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
					<h1 className="text-xl font-semibold leading-7 text-on-surface">Projetos</h1>
					<div className="flex items-center gap-2">
						<button className="grid size-10 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" type="button" onClick={onOpenClients} aria-label="Abrir clientes" title="Abrir clientes">
							<Users className="size-[18px]" aria-hidden="true" />
						</button>
						<button className="grid size-10 place-items-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" type="button" onClick={logout} aria-label="Sair da conta" title="Sair da conta">
							<UserRound className="size-[18px]" aria-hidden="true" />
						</button>
					</div>
				</div>
			</header>

			<section className="mx-auto w-full max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
				<div className="mb-6 flex items-end justify-between gap-4">
					<div>
						<p className="mb-1 text-xs font-bold uppercase tracking-label text-primary">Aperture Operations</p>
						<h2 className="text-2xl font-semibold leading-8 text-on-surface">Seus projetos</h2>
					</div>
					{!isLoading && !errorMessage && <p className="text-sm text-on-surface-variant">{projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}</p>}
				</div>

				<div className="mb-4">
					<SearchInput value={search} onChange={setSearch} placeholder="Buscar projetos..." ariaLabel="Buscar projetos" />
				</div>

				<div className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar projetos por status">
					{(['all', ...projectStatuses] as StatusFilter[]).map((status) => (
						<button className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${statusFilter === status ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status}>
							{status === 'all' ? 'Todos' : statusLabels[status]}
						</button>
					))}
				</div>

				{isLoading && <div className="flex min-h-64 items-center justify-center text-primary" aria-live="polite" aria-label="Carregando projetos"><LoaderCircle className="animate-login-spin size-6" aria-hidden="true" /></div>}

				{!isLoading && errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}

				{!isLoading && !errorMessage && filteredProjects.length === 0 && (
					<div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant px-6 text-center">
						<CalendarDays className="mb-3 size-7 text-outline" aria-hidden="true" />
						<h3 className="text-base font-semibold text-on-surface">{projects.length ? 'Nenhum projeto encontrado' : 'Você ainda não tem projetos'}</h3>
						<p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">{projects.length ? 'Tente buscar por outro título, cliente ou local.' : 'Seus projetos aparecerão aqui quando forem cadastrados.'}</p>
					</div>
				)}

				{!isLoading && !errorMessage && filteredProjects.length > 0 && (
					<div className="grid gap-3" aria-label="Lista de projetos">
						{filteredProjects.map((project) => (
							<Card className="border-0 bg-surface-container-lowest shadow-level-1" key={project.id}>
								<CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
									<div className="min-w-0">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<h3 className="text-base font-semibold text-on-surface">{project.title}</h3>
											<Badge className={`rounded-full hover:opacity-90 ${statusClasses[project.status]}`}>{statusLabels[project.status]}</Badge>
										</div>
										<p className="mt-1 text-sm text-on-surface-variant">{clientNames.get(project.clientId) ?? 'Cliente não encontrado'}</p>
										<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
											<span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{formatDate(project.date)}</span>
											{project.local && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{project.local}</span>}
											<span className="inline-flex items-center gap-1.5"><CircleDollarSign className="size-3.5" aria-hidden="true" />{formatPrice(project.agreed_price)}</span>
										</div>
									</div>
									<div className="flex shrink-0 items-center justify-end gap-1 sm:self-start">
										<Button className="text-on-surface-variant hover:bg-surface-container" variant="ghost" size="icon" type="button" onClick={() => onEditProject(project)} disabled={deletingProjectId === project.id} aria-label={`Editar projeto ${project.title}`} title="Editar projeto">
											<Pencil aria-hidden="true" />
										</Button>
										<Button className="text-error hover:bg-error-container" variant="ghost" size="icon" type="button" onClick={() => void handleDelete(project)} disabled={deletingProjectId === project.id} aria-label={`Excluir projeto ${project.title}`} title="Excluir projeto">
											{deletingProjectId === project.id ? <LoaderCircle className="animate-login-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
										</Button>
									</div>
									{project.notes && <p className="border-t border-surface-container pt-3 text-sm leading-5 text-on-surface-variant sm:col-span-2">{project.notes}</p>}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			<button className="fixed bottom-6 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 transition-transform hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:bottom-8 sm:right-8" type="button" onClick={onCreateProject} aria-label="Adicionar projeto" title="Adicionar projeto"><Plus className="size-6" aria-hidden="true" /></button>
		</main>
	)
}

export default Projects
