import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types'

interface NavItem {
  to: string
  label: string
}

function getLinks(role: Role): NavItem[] {
  if (role === 'OFFICE_MANAGER') {
    return [
      { to: '/om', label: 'Dashboard' },
      { to: '/om/appointments', label: 'Appointments' },
      { to: '/om/requests', label: 'Requests' },
      { to: '/om/dentists', label: 'Dentists' },
      { to: '/om/patients', label: 'Patients' },
      { to: '/om/surgeries', label: 'Surgeries' },
      { to: '/om/bills', label: 'Bills' },
    ]
  }
  if (role === 'DENTIST') {
    return [{ to: '/dentist', label: 'My Appointments' }]
  }
  return [
    { to: '/patient', label: 'My Appointments' },
    { to: '/patient/bills', label: 'My Bills' },
    { to: '/patient/request', label: 'Request Appointment' },
  ]
}

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const links = getLinks(user.role)

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-6 flex-wrap">
        <span className="font-bold text-lg whitespace-nowrap">Dental Surgery Ops</span>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/om' || l.to === '/dentist' || l.to === '/patient'}
            className={({ isActive }) =>
              isActive ? 'underline font-semibold text-sm' : 'hover:underline text-sm'
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 whitespace-nowrap"
      >
        Logout
      </button>
    </nav>
  )
}
