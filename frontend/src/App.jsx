import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

const token = localStorage.getItem('token')

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!token)

  useEffect(() => {
    if (token) {
      fetch('https://boostix-o2ty.onrender.com/api/orders/auth/me', {
        headers: { Authorization: token }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setUser(data.user)
          else localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    }
  }, [])

  if (loading) return <div className="loading">Загрузка...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App