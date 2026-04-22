import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types'

interface Props {
  allowedRoles: Role[]
}

function roleRoot(role: Role): string {
  if (role === 'OFFICE_MANAGER') return '/om'
  if (role === 'DENTIST') return '/dentist'
  return '/patient'
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleRoot(user.role)} replace />
  return <Outlet />
}
