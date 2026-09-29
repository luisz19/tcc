import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Aperture, Eye, EyeOff, KeyRound, LoaderCircle, Mail, UserRound } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerRequest } from '@/api/auth'
import '../App.css'

interface RegisterProps {
	onLogin: () => void
}

function Register({ onLogin }: RegisterProps) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [passwordConfirmation, setPasswordConfirmation] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [successMessage, setSuccessMessage] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage('')
		setSuccessMessage('')

		if (password !== passwordConfirmation) {
			setErrorMessage('As senhas precisam ser iguais.')
			return
		}

		setIsSubmitting(true)

		try {
			await registerRequest(name.trim(), email.trim(), password)
			setSuccessMessage('Conta criada com sucesso. Faça login para continuar.')
			setName('')
			setEmail('')
			setPassword('')
			setPasswordConfirmation('')
		} catch (error) {
			const message = isAxiosError(error) && error.response?.status === 409
				? 'Este e-mail já está cadastrado.'
				: 'Não foi possível criar sua conta agora. Tente novamente.'
			setErrorMessage(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden bg-surface px-5 text-on-surface sm:px-6">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(67,70,86,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(67,70,86,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />

			<section className="relative z-10 w-full max-w-[398px] py-8 sm:py-10" aria-labelledby="register-title">
				<div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-surface-container-lowest text-primary shadow-level-1" aria-hidden="true">
					<Aperture className="size-6 stroke-[2.4]" />
				</div>

				<header className="mb-8 text-center">
					<p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] leading-4 text-primary">Aperture Operations</p>
					<h1 id="register-title" className="text-2xl font-semibold leading-8 text-on-surface sm:text-[32px] sm:leading-10">Crie sua conta</h1>
					<p className="mt-2 text-sm leading-[22px] text-on-surface-variant">Comece a organizar seus projetos<br className="hidden sm:inline" /> e clientes em um só lugar.</p>
				</header>

				<form className="grid gap-4" onSubmit={handleSubmit}>
					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="name">Nome</Label>
						<div className="relative">
							<UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome completo" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
						</div>
					</div>

					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="register-email">E-mail</Label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="register-email" name="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
						</div>
					</div>

					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="register-password">Senha</Label>
						<div className="relative">
							<KeyRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 pr-11 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
							<button className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
								{showPassword ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
							</button>
						</div>
					</div>

					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="password-confirmation">Confirmar senha</Label>
						<div className="relative">
							<KeyRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 pr-11 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15" id="password-confirmation" name="passwordConfirmation" type={showPasswordConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength={8} required aria-invalid={Boolean(errorMessage)} />
							<button className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" type="button" onClick={() => setShowPasswordConfirmation((visible) => !visible)} aria-label={showPasswordConfirmation ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}>
								{showPasswordConfirmation ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
							</button>
						</div>
					</div>

					{errorMessage && <Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
					{successMessage && <Alert className="border-primary/20 bg-primary-fixed text-on-primary-fixed"><AlertDescription>{successMessage}</AlertDescription></Alert>}

					<Button className="mt-2 h-12 w-full rounded-md bg-primary text-sm text-on-primary shadow-[0_4px_12px_rgb(0_64_224_/_18%)] hover:bg-primary-container" type="submit" disabled={isSubmitting}>
						{isSubmitting && <LoaderCircle className="animate-login-spin size-4" aria-hidden="true" />}
						{isSubmitting ? 'Criando conta...' : 'Criar conta'}
					</Button>

					<p className="text-center text-sm leading-[22px] text-on-surface-variant">
						Já tem uma conta?{' '}
						<button className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" type="button" onClick={onLogin}>Faça o login!</button>
					</p>
				</form>
			</section>
		</main>
	)
}

export default Register
