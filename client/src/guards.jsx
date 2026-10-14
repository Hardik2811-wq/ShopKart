import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'

const Loading = () => <p className="loading">Checking session...</p>

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to="/home" replace /> : children
}
