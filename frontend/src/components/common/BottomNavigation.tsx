import { BriefcaseBusiness, House, UsersRound, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationItems = [
	{ label: 'Início', path: '/home', icon: House },
	{ label: 'Projetos', path: '/projects', icon: BriefcaseBusiness },
	{ label: 'Clientes', path: '/clients', icon: UsersRound },
	{ label: 'Financeiro', path: '/finance', icon: WalletCards },
]

function BottomNavigation() {
	return (
		<nav className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-container bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(25_28_29_/_4%)] backdrop-blur-sm" aria-label="Navegação principal">
			<div className="mx-auto grid h-16 max-w-2xl grid-cols-4 px-2">
				{navigationItems.map(({ label, path, icon: Icon }) => (
					<NavLink
						className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
						key={path}
						to={path}
					>
						<Icon className="size-5" aria-hidden="true" />
						<span>{label}</span>
					</NavLink>
				))}
			</div>
		</nav>
	)
}

export default BottomNavigation
