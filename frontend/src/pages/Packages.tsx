import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Box, LoaderCircle, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPackages, deletePackage } from '@/api/package'
import type { Package } from '@/types/packages'
import { useAuth } from '@/context/AuthContext'
import '../App.css'

interface PackagesProps {
	onCreatePackage: () => void
	onEditPackage: (packageItem: Package) => void
}

function formatPrice(price: number | string) {
	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price))
}

function Packages({ onCreatePackage, onEditPackage }: PackagesProps) {
	const { logout } = useAuth()
	const [packages, setPackages] = useState<Package[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState('')

	useEffect(() => {
		let isMounted = true

		void getPackages()
			.then((data) => {
				if (isMounted) {
					setPackages(data)
				}
			})
			.catch((error: unknown) => {
				if (isMounted) {
					setErrorMessage(isAxiosError(error) && error.response?.status === 401
						? 'Sua sessão expirou. Entre novamente para visualizar os pacotes.'
						: 'Não foi possível carregar os pacotes agora.')
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

	async function handleDelete(packageItem: Package) {
		if (!window.confirm(`Excluir o pacote "${packageItem.name}"?`)) {
			return
		}

		setDeletingId(packageItem.id)
		setErrorMessage('')
		try {
			await deletePackage(packageItem.id)
			setPackages((currentPackages) => currentPackages.filter(({ id }) => id !== packageItem.id))
		} catch {
			setErrorMessage('Não foi possível excluir o pacote agora.')
		} finally {
			setDeletingId(null)
		}
	}

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
					<h1 className="text-xl font-semibold leading-7">Pacotes</h1>
					<button className="grid size-10 place-items-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" type="button" onClick={logout} aria-label="Sair da conta" title="Sair da conta"><UserRound className="size-[18px]" aria-hidden="true" /></button>
				</div>
			</header>

			<section className="mx-auto w-full max-w-4xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
				<div className="mb-6 flex items-end justify-between gap-4">
					<div><p className="mb-1 text-xs font-bold uppercase tracking-label text-primary">Projetos</p><h2 className="text-2xl font-semibold leading-8">Seus pacotes</h2></div>
					{!isLoading && !errorMessage && <p className="text-sm text-on-surface-variant">{packages.length} {packages.length === 1 ? 'pacote' : 'pacotes'}</p>}
				</div>

				{isLoading && <div className="flex min-h-64 items-center justify-center text-primary" aria-label="Carregando pacotes"><LoaderCircle className="animate-login-spin size-6" aria-hidden="true" /></div>}
				{!isLoading && errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
				{!isLoading && !errorMessage && packages.length === 0 && <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant px-6 text-center"><Box className="mb-3 size-7 text-outline" aria-hidden="true" /><h3 className="text-base font-semibold">Você ainda não tem pacotes</h3><p className="mt-1 max-w-sm text-sm leading-6 text-on-surface-variant">Crie pacotes para reutilizar preços e vinculá-los aos seus projetos.</p></div>}
				{!isLoading && !errorMessage && packages.length > 0 && <div className="grid gap-3 sm:grid-cols-2" aria-label="Lista de pacotes">{packages.map((packageItem) => <Card className="border-0 bg-surface-container-lowest shadow-level-1" key={packageItem.id}><CardContent className="grid gap-4 p-4"><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed"><Box className="size-5" aria-hidden="true" /></div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{packageItem.name}</h3><p className="mt-1 text-sm text-on-surface-variant">{packageItem.description || 'Sem descrição'}</p></div></div><div className="flex items-center justify-between gap-3 border-t border-surface-container pt-3"><div><p className="text-[10px] font-bold uppercase tracking-label text-on-surface-variant">Preço base</p><p className="mt-1 font-semibold text-primary">{formatPrice(packageItem.base_price)}</p></div><div className="flex gap-1"><Button className="text-on-surface-variant hover:bg-surface-container" variant="ghost" size="icon" type="button" onClick={() => onEditPackage(packageItem)} aria-label={`Editar pacote ${packageItem.name}`} title="Editar pacote"><Pencil aria-hidden="true" /></Button><Button className="text-error hover:bg-error-container" variant="ghost" size="icon" type="button" onClick={() => void handleDelete(packageItem)} disabled={deletingId === packageItem.id} aria-label={`Excluir pacote ${packageItem.name}`} title="Excluir pacote">{deletingId === packageItem.id ? <LoaderCircle className="animate-login-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}</Button></div></div><Badge className="w-fit rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed">Pacote reutilizável</Badge></CardContent></Card>)}</div>}
			</section>

			<button className="fixed bottom-20 right-5 z-20 grid size-12 place-items-center rounded-lg bg-primary text-on-primary shadow-level-2 transition-transform hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:bottom-24 sm:right-8" type="button" onClick={onCreatePackage} aria-label="Adicionar pacote" title="Adicionar pacote"><Plus className="size-6" aria-hidden="true" /></button>
		</main>
	)
}

export default Packages
