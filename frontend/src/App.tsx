import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/Register'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import Packages from './pages/Packages'
import Home from './pages/Home'
import Financial from './pages/Financial'
import FinancialForm from './pages/financials/FinancialForm'
import ClientForm from './pages/clients/ClientForm'
import ClientDetails from './pages/clients/ClientDetails'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectDetails from './pages/projects/ProjectDetails'
import PackageForm from './pages/packages/PackageForm'
import AuthenticatedLayout from './components/common/AuthenticatedLayout'
import type { Client } from './types/clients'
import type { Project } from './types/projects'
import type { Package } from './types/packages'
import type { Financial as FinancialRecord } from './types/financial'
import { useAuth } from './context/AuthContext'

function ProjectEditRoute({ project }: { project?: Project }) {
  const navigate = useNavigate()

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  return <ProjectForm project={project} onCancel={() => navigate('/projects')} onSaved={() => navigate('/projects')} />
}

function ClientEditRoute({ client }: { client?: Client }) {
  const navigate = useNavigate()

  if (!client) {
    return <Navigate to="/clients" replace />
  }

  return <ClientForm client={client} onCancel={() => navigate('/clients')} onSaved={() => navigate('/clients')} />
}

function PackageEditRoute({ packageItem }: { packageItem?: Package }) {
  const navigate = useNavigate()

  if (!packageItem) {
    return <Navigate to="/projects/packages" replace />
  }

  return <PackageForm packageItem={packageItem} onCancel={() => navigate('/projects/packages')} onSaved={() => navigate('/projects/packages')} />
}

function FinancialEditRoute({ financial }: { financial?: FinancialRecord }) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as {
    fromProjectId?: string
    fromProject?: boolean
    projectId?: string
  } | undefined

  if (!financial) {
    return <Navigate to="/finance" replace />
  }

  const handleReturn = () => {
    if (locationState?.fromProjectId) {
      navigate(`/projects/${locationState.fromProjectId}`)
    } else if (locationState?.fromProject && financial.projectId) {
      navigate(`/projects/${financial.projectId}`)
    } else {
      navigate('/finance')
    }
  }

  return <FinancialForm financial={financial} onCancel={handleReturn} onSaved={handleReturn} />
}

function FinancialNewRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as {
    fromProjectId?: string
    fromProject?: boolean
    projectId?: string
  } | undefined

  const handleReturn = () => {
    if (locationState?.fromProjectId) {
      navigate(`/projects/${locationState.fromProjectId}`)
    } else if (locationState?.fromProject && locationState?.projectId) {
      navigate(`/projects/${locationState.projectId}`)
    } else {
      navigate('/finance')
    }
  }

  return <FinancialForm onCancel={handleReturn} onSaved={handleReturn} />
}

function App() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const selectedProject = location.state?.project as Project | undefined
  const selectedClient = location.state?.client as Client | undefined
  const selectedPackage = location.state?.packageItem as Package | undefined
  const selectedFinancial = location.state?.financial as FinancialRecord | undefined

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/register" element={<Register onLogin={() => navigate('/login')} />} />
        <Route path="*" element={<Login onRegister={() => navigate('/register')} />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AuthenticatedLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />

        <Route path="/projects" element={<Projects onOpenPackages={() => navigate('/projects/packages')} onCreateProject={() => navigate('/projects/new')} onViewProject={(project) => navigate(`/projects/${project.id}`, { state: { project } })} />} />
        <Route path="/projects/new" element={<ProjectForm onCancel={() => navigate('/projects')} onSaved={() => navigate('/projects')} />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/projects/:id/edit" element={<ProjectEditRoute project={selectedProject} />} />
        <Route path="/projects/packages" element={<Packages onCreatePackage={() => navigate('/projects/packages/new')} onEditPackage={(packageItem) => navigate(`/projects/packages/${packageItem.id}/edit`, { state: { packageItem } })} />} />
        <Route path="/projects/packages/new" element={<PackageForm onCancel={() => navigate('/projects/packages')} onSaved={() => navigate('/projects/packages')} />} />
        <Route path="/projects/packages/:id/edit" element={<PackageEditRoute packageItem={selectedPackage} />} />

        <Route path="/clients" element={<Clients onCreateClient={() => navigate('/clients/new')} onViewClient={(client) => navigate(`/clients/${client.id}`, { state: { client } })} />} />
        <Route path="/clients/new" element={<ClientForm onCancel={() => navigate('/clients')} onSaved={() => navigate('/clients')} />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/clients/:id/edit" element={<ClientEditRoute client={selectedClient} />} />

        <Route path="/finance" element={<Financial onCreateFinancial={() => navigate('/finance/new')} onEditFinancial={(financial) => navigate(`/finance/${financial.id}/edit`, { state: { financial } })} />} />
        <Route path="/finance/new" element={<FinancialNewRoute />} />
        <Route path="/finance/:id/edit" element={<FinancialEditRoute financial={selectedFinancial} />} />
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}

export default App
