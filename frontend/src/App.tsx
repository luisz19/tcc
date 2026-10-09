import { useState } from 'react'
import Login from './pages/login'
import Register from './pages/Register'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import ClientForm from './pages/clients/ClientForm'
import ProjectForm from './pages/projects/ProjectForm'
import type { Client } from './types/clients'
import type { Project } from './types/projects'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState<'login' | 'register'>('login')
  const [authenticatedPage, setAuthenticatedPage] = useState<'projects' | 'clients'>('projects')
  const [clientPage, setClientPage] = useState<'list' | 'form'>('list')
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [projectPage, setProjectPage] = useState<'list' | 'form'>('list')
  const [selectedProject, setSelectedProject] = useState<Project | undefined>()

  if (isAuthenticated) {
    if (projectPage === 'form') {
      return (
        <ProjectForm
          project={selectedProject}
          onCancel={() => {
            setSelectedProject(undefined)
            setProjectPage('list')
          }}
          onSaved={() => {
            setSelectedProject(undefined)
            setProjectPage('list')
          }}
        />
      )
    }

    if (clientPage === 'form') {
      return (
        <ClientForm
          client={selectedClient}
          onCancel={() => {
            setSelectedClient(undefined)
            setClientPage('list')
          }}
          onSaved={() => {
            setSelectedClient(undefined)
            setClientPage('list')
          }}
        />
      )
    }

    if (authenticatedPage === 'projects') {
      return (
        <Projects
          onOpenClients={() => setAuthenticatedPage('clients')}
          onCreateProject={() => {
            setSelectedProject(undefined)
            setProjectPage('form')
          }}
          onEditProject={(project) => {
            setSelectedProject(project)
            setProjectPage('form')
          }}
        />
      )
    }

    return (
      <Clients
        onOpenProjects={() => setAuthenticatedPage('projects')}
        onCreateClient={() => {
          setSelectedClient(undefined)
          setClientPage('form')
        }}
        onEditClient={(client) => {
          setSelectedClient(client)
          setClientPage('form')
        }}
      />
    )
  }

  return page === 'login' ? (
    <Login onRegister={() => setPage('register')} />
  ) : (
    <Register onLogin={() => setPage('login')} />
  )
}

export default App
