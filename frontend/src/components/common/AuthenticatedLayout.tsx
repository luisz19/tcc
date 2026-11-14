import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'

function AuthenticatedLayout() {
	return (
		<div className="min-h-screen pb-24 sm:pb-28">
			<Outlet />
			<BottomNavigation />
		</div>
	)
}

export default AuthenticatedLayout
