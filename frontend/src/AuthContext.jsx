import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isAuthenticated = email !== '' && password !== ''

  const login = (userEmail, userPassword) => {
    setEmail(userEmail)
    setPassword(userPassword)
  }

  const logout = () => {
    setEmail('')
    setPassword('')
  }

  const getAuthHeader = () => {
    if (!isAuthenticated) return null
    const credentials = btoa(email + ':' + password)
    return 'Basic ' + credentials
  }

  return (
    <AuthContext.Provider value={{ email, password, isAuthenticated, login, logout, getAuthHeader }}>
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
