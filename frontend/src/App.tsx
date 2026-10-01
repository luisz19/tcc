import { useState } from 'react'
import Login from './pages/login'
import Register from './pages/Register'
import Clients from './pages/Clients'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState<'login' | 'register'>('login')

  if (isAuthenticated) {
    return <Clients />
  }

  return page === 'login' ? (
    <Login onRegister={() => setPage('register')} />
  ) : (
    <Register onLogin={() => setPage('login')} />
  )
}

export default App
