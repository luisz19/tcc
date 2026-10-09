import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { BriefcaseBusiness, ChevronRight, LoaderCircle, Plus, Search, UserRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { getClients } from '@/api/clients'
import type { Client } from '@/types/clients'
import SearchInput from '@/components/common/SearchInput'
import '../App.css'

interface ClientsProps {
	onOpenProjects: () => void
	onCreateClient: () => void
	onEditClient: (client: Client) => void
}

function getInitials(name: string) {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')
}

function formatPhone(phone: string) {
	return phone || 'Telefone não informado'
}

function Clients({ onOpenProjects, onCreateClient, onEditClient }: ClientsProps) {
	const { logout } = useAuth()
	const [clients, setClients] = useState<Client[]>([])
	const [search, setSearch] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')

	useEffect(() => {
		let isMounted = true

		void getClients()
			.then((data) => {
				if (isMounted) {
					setClients(data)
				}
			})
			.catch((error) => {
				if (isMounted) {
					setErrorMessage(isAxiosError(error) && error.response?.status === 401
						? 'Sua sessão expirou. Entre novamente para visualizar os clientes.'
						: 'Não foi possível carregar os clientes agora.')
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

	const filteredClients = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()

		if (!normalizedSearch) {
			return clients
		}

		return clients.filter((client) =>
			[client.name, client.email, client.phone]
				.filter(Boolean)
				.some((value) => value?.toLowerCase().includes(normalizedSearch)),
		)
	}, [clients, search])

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
					<h1 className="text-xl font-semibold leading-7 text-on-surface">Clientes</h1>
					<div className="flex items-center gap-2">
						<button className="grid size-10 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" type="button" onClick={onOpenProjects} aria-label="Abrir projetos" title="Abrir projetos">
							<BriefcaseBusiness className="size-[18px]" aria-hidden="true" />
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
						<h2 className="text-2xl font-semibold leading-8 text-on-surface">Sua rede de clientes</h2>
					</div>
					{!isLoading && !errorMessage && <p className="text-sm text-on-surface-variant">{clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}</p>}
				</div>

				<div className="mb-6">
					<SearchInput value={search} onChange={setSearch} placeholder="Buscar clientes..." ariaLabel="Buscar clientes" />
				</div>

				{isLoading && (
					<div className="flex min-h-64 items-center justify-center text-primary" aria-live="polite" aria-label="Carregando clientes">
						<LoaderCircle className="animate-login-spin size-6" aria-hidden="true" />
					</div>
				)}

				{!isLoading && errorMessage && (
					<Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				{!isLoading && !errorMessage && filteredClients.length === 0 && (
					<div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant px-6 text-center">
						<Search className="mb-3 size-7 text-outline" aria-hidden="true" />
						<h3 className="text-base font-semibold text-on-surface">{clients.length ? 'Nenhum cliente encontrado' : 'Você ainda não tem clientes'}</h3>
						<p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">{clients.length ? 'Tente buscar por outro nome, e-mail ou telefone.' : 'Seus clientes aparecerão aqui quando forem cadastrados.'}</p>
					</div>
				)}

				{!isLoading && !errorMessage && filteredClients.length > 0 && (
					<div className="grid gap-3" aria-label="Lista de clientes">
						{filteredClients.map((client) => (
							<Card
								className="cursor-pointer border-0 bg-surface-container-lowest shadow-level-1 transition-shadow hover:shadow-level-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
								key={client.id}
								onClick={() => onEditClient(client)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault()
										onEditClient(client)
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`Editar cliente ${client.name}`}
							>
								<CardContent className="flex min-h-24 items-center gap-3 p-4">
									<div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-fixed text-sm font-semibold text-on-primary-fixed" aria-hidden="true">{getInitials(client.name)}</div>
									<div className="min-w-0 flex-1">
										<h3 className="truncate text-sm font-medium text-on-surface">{client.name}</h3>
										<p className="mt-1 truncate text-xs text-on-surface-variant">{formatPhone(client.phone)}</p>
										{client.email && <p className="truncate text-xs text-on-surface-variant">{client.email}</p>}
									</div>
									<div className="hidden shrink-0 text-right sm:block">
										<p className="text-[10px] font-bold uppercase tracking-label text-on-surface-variant">Cadastro</p>
										<Badge className="mt-1 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed">{client.personType === 'company' ? 'Empresa' : 'Cliente'}</Badge>
									</div>
									<ChevronRight className="size-5 shrink-0 text-outline" aria-hidden="true" />
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			<button className="fixed bottom-6 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 transition-transform hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:bottom-8 sm:right-8" type="button" onClick={onCreateClient} aria-label="Adicionar cliente" title="Adicionar cliente">
				<Plus className="size-6" aria-hidden="true" />
			</button>
		</main>
	)
}

export default Clients
