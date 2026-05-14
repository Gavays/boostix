import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch('https://boostix-o2ty.onrender.com/api/orders/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        navigate('/dashboard')
      } else {
        setError(data.error || 'Ошибка входа')
      }
    } catch {
      setError('Ошибка соединения')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🤖 Boostix</h1>
        <p>Войдите, чтобы продолжить</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Введите ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Войти</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}

export default Login