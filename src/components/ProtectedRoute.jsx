import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute() {
  const { user, loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
