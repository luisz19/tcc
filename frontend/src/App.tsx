import { useState } from 'react'
import Login from './pages/login'
import Register from './pages/Register'
import Clients from './pages/Clients'
import ClientForm from './pages/clients/ClientForm'
import type { Client } from './types/clients'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState<'login' | 'register'>('login')
  const [clientPage, setClientPage] = useState<'list' | 'form'>('list')
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()

  if (isAuthenticated) {
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

    return (
      <Clients
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
