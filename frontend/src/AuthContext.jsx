import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')

  const isAuthenticated = accessToken !== ''

  const login = async (userEmail, userPassword) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    setEmail(data.email)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
  }

  const logout = () => {
    setEmail('')
    setAccessToken('')
    setRefreshToken('')
  }

  const getAuthHeader = () => {
    if (!isAuthenticated) return null
    return 'Bearer ' + accessToken
  }

  return (
    <AuthContext.Provider value={{ email, isAuthenticated, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
