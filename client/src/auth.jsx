import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customers/me').then(({ data }) => setUser(data)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    try {
      await api.post('/customers/logout')
    } catch {
      // ignore network or 401 error during logout
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
