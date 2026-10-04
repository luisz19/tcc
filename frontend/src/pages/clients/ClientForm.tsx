import { useState } from 'react'
import { isAxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Building2, LoaderCircle, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient, updateClient, type ClientPayload } from '@/api/clients'
import type { Client } from '@/types/clients'
import '../../App.css'

interface ClientFormProps {
	client?: Client
	onCancel: () => void
	onSaved: () => void
}

const clientSchema = z.object({
	name: z.string().trim().min(2, 'Informe o nome do cliente.'),
	phone: z.string().trim().min(1, 'Informe o telefone.'),
	email: z.string().trim().email('Informe um e-mail válido.').or(z.literal('')),
	address: z.string().trim(),
	personType: z.enum(['individual', 'company']),
})

type ClientFormData = z.infer<typeof clientSchema>

function ClientForm({ client, onCancel, onSaved }: ClientFormProps) {
	'use no memo'

	const isEditing = Boolean(client)
	const [errorMessage, setErrorMessage] = useState('')
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			name: client?.name ?? '',
			phone: client?.phone ?? '',
			email: client?.email ?? '',
			address: client?.address ?? '',
			personType: client?.personType === 'company' ? 'company' : 'individual',
		},
	})

async function onSubmit(data: ClientFormData) {
		setErrorMessage('')

		const payload: ClientPayload = {
			name: data.name,
			phone: data.phone,
			email: data.email || undefined,
			address: data.address || undefined,
			personType: data.personType,
		}

		try {
			if (client) {
				await updateClient(client.id, payload)
			} else {
				await createClient(payload)
			}
			onSaved()
		} catch (error) {
			setErrorMessage(isAxiosError(error) && error.response?.status === 409
				? 'Já existe um cliente com esse nome.'
				: `Não foi possível ${isEditing ? 'atualizar' : 'cadastrar'} o cliente agora.`)
		}
	}

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="sticky top-0 z-20 border-b border-surface-container bg-surface/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-5 sm:px-8">
					<Button className="size-10 rounded-full text-on-surface-variant hover:bg-surface-container" variant="ghost" size="icon" type="button" onClick={onCancel} aria-label="Voltar para clientes">
						<ArrowLeft aria-hidden="true" />
					</Button>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-label text-primary">Aperture Operations</p>
						<h1 className="text-lg font-semibold text-on-surface">{isEditing ? 'Editar cliente' : 'Novo cliente'}</h1>
					</div>
				</div>
			</header>

			<section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
				<div className="mb-6">
					<h2 className="text-2xl font-semibold leading-8 text-on-surface">Informações do cliente</h2>
					<p className="mt-1 text-sm leading-6 text-on-surface-variant">Preencha apenas os dados necessários para manter seus contatos organizados.</p>
				</div>

				<form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<Label htmlFor="client-name">Nome completo <span className="text-error">*</span></Label>
						<div className="relative">
							<UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="client-name" placeholder="Ex.: Mariana Souza" aria-invalid={Boolean(errors.name)} {...register('name')} />
						</div>
						{errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="client-phone">Telefone <span className="text-error">*</span></Label>
						<div className="relative">
							<Phone className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="client-phone" type="tel" placeholder="(11) 99999-9999" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
						</div>
						{errors.phone && <p className="text-xs text-error">{errors.phone.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="client-email">E-mail <span className="text-xs font-normal normal-case text-on-surface-variant">(opcional)</span></Label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="client-email" type="email" placeholder="mariana@exemplo.com" aria-invalid={Boolean(errors.email)} {...register('email')} />
						</div>
						{errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="client-address">Endereço <span className="text-xs font-normal normal-case text-on-surface-variant">(opcional)</span></Label>
						<div className="relative">
							<MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="client-address" placeholder="Rua, número, cidade e estado" {...register('address')} />
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="client-person-type">Tipo de cliente <span className="text-xs font-normal normal-case text-on-surface-variant">(opcional)</span></Label>
						<div className="relative">
							<Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<select className="h-12 w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" id="client-person-type" {...register('personType')}>
								<option value="individual">Pessoa física</option>
								<option value="company">Pessoa jurídica</option>
							</select>
						</div>
					</div>

					{errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}

					<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
						<Button className="h-12 sm:min-w-28" variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
						<Button className="h-12 bg-primary text-on-primary hover:bg-primary-container sm:min-w-36" type="submit" disabled={isSubmitting}>
							{isSubmitting && <LoaderCircle className="animate-login-spin size-4" aria-hidden="true" />}
							{isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar cliente'}
						</Button>
					</div>
				</form>
			</section>
		</main>
	)
}

export default ClientForm