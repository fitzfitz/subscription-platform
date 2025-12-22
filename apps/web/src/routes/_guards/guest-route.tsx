import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (isAuthenticated) {
    // Redirect to admin dashboard or the page they were trying to access
    const from = (location.state as { from?: Location })?.from?.pathname || '/admin'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
