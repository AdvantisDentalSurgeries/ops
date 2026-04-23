import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { navigationByRole, roleAccent, roleTitle } from '../lib/navigation'

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const navItems = navigationByRole[user.role]
  const activeItem =
    navItems.find((item) => location.pathname === item.to) ??
    navItems.find((item) => location.pathname.startsWith(`${item.to}/`)) ??
    navItems[0]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-[var(--glow-teal)] blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-72 w-72 rounded-full bg-[var(--glow-gold)] blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[var(--glow-rose)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/50 bg-[var(--shell)] px-5 py-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r">
          <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_12px_50px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
              Dental Surgery Ops
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight text-slate-900">
              {roleTitle(user.role)}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {roleAccent(user.role)} workspace for appointments, requests, people, and billing.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-900 px-4 py-4 text-slate-100">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signed in as</p>
              <p className="mt-2 text-sm font-semibold">{user.role.replace('_', ' ')}</p>
              <p className="mt-1 text-xs text-slate-400">Secure role-based access is active.</p>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === navItems[0]?.to}
                  className={({ isActive }) =>
                    `block rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_35px_rgba(15,23,42,0.16)]'
                        : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white'
                    }`
                  }
                >
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs leading-5 opacity-80">{item.description}</div>
                </NavLink>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="relative flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="rounded-[32px] border border-white/70 bg-white/72 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6 lg:p-8">
            <header className="mb-8 flex flex-col gap-4 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Active view
                </p>
                <h2 className="mt-3 font-display text-4xl leading-tight text-slate-900">
                  {activeItem?.label ?? 'Workspace'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeItem?.description ??
                    'A calmer, more reliable frontend for the clinic team and patients.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Role</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.25em] text-amber-600">Session</div>
                  <div className="mt-1 text-sm font-semibold text-amber-900">Protected</div>
                </div>
              </div>
            </header>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
