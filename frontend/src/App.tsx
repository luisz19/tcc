import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/Register'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import Packages from './pages/Packages'
import Home from './pages/Home'
import Financial from './pages/Financial'
import ClientForm from './pages/clients/ClientForm'
import ClientDetails from './pages/clients/ClientDetails'
import ProjectForm from './pages/projects/ProjectForm'
import PackageForm from './pages/packages/PackageForm'
import AuthenticatedLayout from './components/common/AuthenticatedLayout'
import type { Client } from './types/clients'
import type { Project } from './types/projects'
import type { Package } from './types/packages'
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

function App() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const selectedProject = location.state?.project as Project | undefined
  const selectedClient = location.state?.client as Client | undefined
  const selectedPackage = location.state?.packageItem as Package | undefined

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

        <Route path="/projects" element={<Projects onOpenPackages={() => navigate('/projects/packages')} onCreateProject={() => navigate('/projects/new')} onEditProject={(project) => navigate(`/projects/${project.id}/edit`, { state: { project } })} />} />
        <Route path="/projects/new" element={<ProjectForm onCancel={() => navigate('/projects')} onSaved={() => navigate('/projects')} />} />
        <Route path="/projects/:id/edit" element={<ProjectEditRoute project={selectedProject} />} />
        <Route path="/projects/packages" element={<Packages onCreatePackage={() => navigate('/projects/packages/new')} onEditPackage={(packageItem) => navigate(`/projects/packages/${packageItem.id}/edit`, { state: { packageItem } })} />} />
        <Route path="/projects/packages/new" element={<PackageForm onCancel={() => navigate('/projects/packages')} onSaved={() => navigate('/projects/packages')} />} />
        <Route path="/projects/packages/:id/edit" element={<PackageEditRoute packageItem={selectedPackage} />} />

        <Route path="/clients" element={<Clients onCreateClient={() => navigate('/clients/new')} onViewClient={(client) => navigate(`/clients/${client.id}`, { state: { client } })} />} />
        <Route path="/clients/new" element={<ClientForm onCancel={() => navigate('/clients')} onSaved={() => navigate('/clients')} />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
        <Route path="/clients/:id/edit" element={<ClientEditRoute client={selectedClient} />} />

        <Route path="/finance" element={<Financial />} />
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}

export default App
