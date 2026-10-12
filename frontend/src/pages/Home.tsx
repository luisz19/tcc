import { ArrowRight, BriefcaseBusiness, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import '../App.css'

function Home() {
	const { user } = useAuth()

	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="border-b border-surface-container bg-surface/95">
				<div className="mx-auto flex h-16 w-full max-w-2xl items-center px-5 sm:px-8">
					<h1 className="text-xl font-semibold">Início</h1>
				</div>
			</header>
			<section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-8 sm:px-8">
				<p className="mb-1 text-xs font-bold uppercase tracking-label text-primary">Aperture Operations</p>
				<h2 className="text-2xl font-semibold leading-8">Olá, {user?.name?.split(' ')[0] ?? 'bem-vindo'}.</h2>
				<p className="mt-2 text-sm leading-6 text-on-surface-variant">Acompanhe seu trabalho e mantenha tudo organizado.</p>

				<div className="mt-8 grid gap-3">
					<Link to="/projects" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
						<Card className="border-0 bg-surface-container-lowest shadow-level-1 transition-shadow hover:shadow-level-2">
							<CardContent className="flex items-center gap-4 p-5">
								<div className="grid size-11 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed"><BriefcaseBusiness className="size-5" aria-hidden="true" /></div>
								<div className="min-w-0 flex-1"><h3 className="font-semibold">Projetos</h3><p className="mt-1 text-sm text-on-surface-variant">Veja e organize seus trabalhos.</p></div>
								<ArrowRight className="size-5 text-outline" aria-hidden="true" />
							</CardContent>
						</Card>
					</Link>
					<Link to="/clients" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
						<Card className="border-0 bg-surface-container-lowest shadow-level-1 transition-shadow hover:shadow-level-2">
							<CardContent className="flex items-center gap-4 p-5">
								<div className="grid size-11 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed"><UsersRound className="size-5" aria-hidden="true" /></div>
								<div className="min-w-0 flex-1"><h3 className="font-semibold">Clientes</h3><p className="mt-1 text-sm text-on-surface-variant">Acesse sua rede de contatos.</p></div>
								<ArrowRight className="size-5 text-outline" aria-hidden="true" />
							</CardContent>
						</Card>
					</Link>
				</div>
			</section>
		</main>
	)
}

export default Home
