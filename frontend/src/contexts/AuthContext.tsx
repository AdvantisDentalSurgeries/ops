import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../lib/axios'
import { AuthUser, Role, LoginResponse, Appointment } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ role: Role }>
  logout: () => void
  setProfileId: (id: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadFromStorage)

  async function login(email: string, password: string): Promise<{ role: Role }> {
    const { data } = await api.post<LoginResponse>('/api/auth/login', { email, password })
    const { access_token, role, userId } = data

    const authUser: AuthUser = { token: access_token, role, userId, profileId: null }

    localStorage.setItem('token', access_token)

    if (role === 'PATIENT') {
      try {
        const { data: appts } = await api.get<Appointment[]>('/api/appointments', {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        if (appts.length > 0 && appts[0].patient?.id) {
          authUser.profileId = appts[0].patient.id
        }
      } catch {
        // profileId stays null; PatientBillsPage resolves it lazily
      }
    }

    localStorage.setItem('auth', JSON.stringify(authUser))
    setUser(authUser)
    return { role }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    setUser(null)
  }

  function setProfileId(id: string) {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, profileId: id }
      localStorage.setItem('auth', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setProfileId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
