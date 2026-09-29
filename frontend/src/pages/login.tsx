import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Aperture, Eye, EyeOff, KeyRound, LoaderCircle, Mail } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import '../App.css'

function Login() {
	const { user, loading, isAuthenticated, login } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	if (loading) {
		return (
			<main className="grid min-h-screen place-items-center overflow-hidden bg-surface text-on-surface" aria-label="Carregando aplicação">
				<LoaderCircle className="animate-login-spin text-primary" aria-hidden="true" />
			</main>
		)
	}

	if (isAuthenticated) {
		return (
			<main className="grid min-h-screen place-items-center overflow-hidden bg-surface text-on-surface">
				<section className="text-center" aria-live="polite">
					<div className="mx-auto mb-6 grid size-12 place-items-center rounded-xl bg-surface-container-lowest text-primary shadow-level-1" aria-hidden="true">
						<Aperture className="size-6" />
					</div>
					<p className="mb-2 text-xs font-bold uppercase tracking-label text-primary">Acesso autorizado</p>
					<h1 className="text-2xl font-semibold leading-8 text-on-surface sm:text-[32px] sm:leading-10">Bem-vindo, {user?.name || 'de volta'}.</h1>
				</section>
			</main>
		)
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage('')
		setIsSubmitting(true)

		try {
			await login(email.trim(), password)
		} catch (error) {
			const message = isAxiosError(error) && error.response?.status === 401
				? 'E-mail ou senha incorretos.'
				: 'Não foi possível entrar agora. Tente novamente.'
			setErrorMessage(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden bg-surface px-5 text-on-surface sm:px-6">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(67,70,86,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(67,70,86,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />

			<section className="relative z-10 w-full max-w-[398px] py-8 sm:py-10" aria-labelledby="login-title">
				<div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-surface-container-lowest text-primary shadow-level-1" aria-hidden="true">
					<Aperture className="size-6 stroke-[2.4]" />
				</div>

				<header className="mb-8 text-center">
					<p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] leading-4 text-primary">Aperture Operations</p>
					<h1 id="login-title" className="text-2xl font-semibold leading-8 text-on-surface sm:text-[32px] sm:leading-10">Bem-vindo</h1>
					<p className="mt-2 text-sm leading-[22px] text-on-surface-variant">Acesse sua conta para gerenciar<br className="hidden sm:inline" /> seus projetos e clientes.</p>
				</header>

				<form className="grid gap-4" onSubmit={handleSubmit}>
					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="email">E-mail</Label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input
								className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 pr-11 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15"
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="seu@email.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								aria-invalid={Boolean(errorMessage)}
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<Label className="text-[11px] font-bold uppercase tracking-[0.06em] leading-4 text-on-surface-variant" htmlFor="password">Senha</Label>
						<div className="relative">
							<KeyRound className="pointer-events-none absolute left-3 top-1/2 z-10 size-[17px] -translate-y-1/2 text-outline" aria-hidden="true" />
							<Input
								className="h-12 rounded-md border-outline-variant bg-surface-container-lowest/70 pl-10 pr-11 text-sm text-on-surface placeholder:text-outline focus-visible:border-primary focus-visible:ring-primary/15"
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autoComplete="current-password"
								placeholder="••••••••"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								minLength={8}
								required
								aria-invalid={Boolean(errorMessage)}
							/>
							<button
								className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
								type="button"
								onClick={() => setShowPassword((visible) => !visible)}
								aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
							>
								{showPassword ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
							</button>
						</div>
					</div>

					<div className="flex justify-end -mt-0.5">
						<a className="rounded-sm text-xs font-semibold leading-5 text-primary outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary/25" href="#forgot-password">Esqueci minha senha</a>
					</div>

					{errorMessage && (
						<Alert variant="destructive" className="border-error/25 bg-error-container text-on-error-container">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}

					<Button className="mt-2 h-12 w-full rounded-md bg-primary text-sm text-on-primary shadow-[0_4px_12px_rgb(0_64_224_/_18%)] hover:bg-primary-container" type="submit" disabled={isSubmitting}>
						{isSubmitting && <LoaderCircle className="animate-login-spin size-4" aria-hidden="true" />}
						{isSubmitting ? 'Entrando...' : 'Entrar'}
					</Button>
				</form>
			</section>
		</main>
	)
}

export default Login
