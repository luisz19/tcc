import { useState } from 'react'
import Login from './pages/login'
import Register from './pages/Register'

function App() {
  const [page, setPage] = useState<'login' | 'register'>('login')

  return page === 'login' ? (
    <Login onRegister={() => setPage('register')} />
  ) : (
    <Register onLogin={() => setPage('login')} />
  )
}

export default App
