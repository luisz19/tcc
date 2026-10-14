import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { ArrowLeft, Building2, Edit3, LoaderCircle, Mail, MapPin, Phone, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteClient, getClient } from '@/api/clients'
import type { Client } from '@/types/clients'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import '../../App.css'

function getInitials(name: string) {
	return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function ClientDetails() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [client, setClient] = useState<Client | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	useEffect(() => {
		if (!id) {
			return
		}

		let isMounted = true
		void getClient(id)
			.then((data) => {
				if (isMounted) {
					setClient(data)
				}
			})
			.catch((error: unknown) => {
				if (isMounted) {
					setErrorMessage(isAxiosError(error) && error.response?.status === 404 ? 'Cliente não encontrado.' : 'Não foi possível carregar este cliente.')
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
	}, [id])

	async function handleDelete() {
		if (!client) {
			return
		}

		setIsDeleting(true)
		setErrorMessage('')
		try {
			await deleteClient(client.id)
			setIsDeleteDialogOpen(false)
			navigate('/clients')
		} catch {
			setErrorMessage('Não foi possível excluir o cliente agora.')
			setIsDeleting(false)
		}
	}

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-5 sm:px-8">
					<Button className="size-10 rounded-full text-on-surface-variant hover:bg-surface-container" variant="ghost" size="icon" type="button" onClick={() => navigate('/clients')} aria-label="Voltar para clientes"><ArrowLeft aria-hidden="true" /></Button>
					<div><p className="text-[10px] font-bold uppercase tracking-label text-primary">Aperture Operations</p><h1 className="text-lg font-semibold">Detalhes do cliente</h1></div>
				</div>
			</header>

			<section className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
				{isLoading && <div className="flex min-h-64 items-center justify-center text-primary" aria-label="Carregando cliente"><LoaderCircle className="animate-login-spin size-6" aria-hidden="true" /></div>}
				{!isLoading && errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
				{!isLoading && client && <>
					<Card className="border-0 bg-surface-container-lowest shadow-level-1"><CardContent className="p-5"><div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-fixed text-lg font-semibold text-on-primary-fixed" aria-hidden="true">{getInitials(client.name)}</div><div className="min-w-0"><h2 className="truncate text-xl font-semibold">{client.name}</h2><p className="mt-1 text-sm text-on-surface-variant">{client.personType === 'company' ? 'Pessoa jurídica' : 'Pessoa física'}</p></div></div></CardContent></Card>
					<Card className="mt-4 border-0 bg-surface-container-lowest shadow-level-1"><CardContent className="grid gap-5 p-5"><h2 className="text-base font-semibold">Informações de contato</h2><div className="grid gap-4 text-sm"><div className="flex items-start gap-3"><Phone className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-xs text-on-surface-variant">Telefone</p><p className="mt-1">{client.phone || 'Não informado'}</p></div></div><div className="flex items-start gap-3"><Mail className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-xs text-on-surface-variant">E-mail</p><p className="mt-1 break-all">{client.email || 'Não informado'}</p></div></div><div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-xs text-on-surface-variant">Endereço</p><p className="mt-1">{client.address || 'Não informado'}</p></div></div><div className="flex items-start gap-3"><Building2 className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-xs text-on-surface-variant">Tipo de cadastro</p><p className="mt-1">{client.personType === 'company' ? 'Pessoa jurídica' : 'Pessoa física'}</p></div></div></div></CardContent></Card>
					<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button className="h-12 text-error hover:bg-error-container sm:min-w-32" variant="outline" type="button" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}><Trash2 aria-hidden="true" />Excluir</Button><Button className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-32" type="button" onClick={() => navigate(`/clients/${client.id}/edit`, { state: { client } })}><Edit3 aria-hidden="true" />Editar</Button></div>
				</>}
			</section>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Excluir cliente?</DialogTitle>
						<DialogDescription>Essa ação removerá {client?.name ? <strong className="font-semibold text-on-surface">{client.name}</strong> : 'este cliente'} permanentemente.</DialogDescription>
					</DialogHeader>
					{errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
					<DialogFooter>
						<DialogClose render={<Button variant="outline" type="button" disabled={isDeleting} />}>Cancelar</DialogClose>
						<Button variant="destructive" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting && <LoaderCircle className="animate-login-spin" aria-hidden="true" />}{isDeleting ? 'Excluindo...' : 'Excluir cliente'}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}

export default ClientDetails