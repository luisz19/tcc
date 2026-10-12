import { WalletCards } from 'lucide-react'
import '../App.css'

function Financial() {
	return (
		<main className="min-h-screen bg-surface text-on-surface">
			<header className="border-b border-surface-container bg-surface/95">
				<div className="mx-auto flex h-16 w-full max-w-2xl items-center px-5 sm:px-8">
					<h1 className="text-xl font-semibold">Financeiro</h1>
				</div>
			</header>
			<section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center px-5 pb-24 text-center sm:px-8">
				<div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary-fixed text-on-primary-fixed"><WalletCards className="size-6" aria-hidden="true" /></div>
				<h2 className="text-xl font-semibold">Financeiro</h2>
				<p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">Acompanhe seus recebimentos e despesas em um só lugar.</p>
			</section>
		</main>
	)
}

export default Financial
