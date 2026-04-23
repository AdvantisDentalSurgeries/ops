import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'

const sections = [
  { to: '/om/appointments', label: 'Appointments', desc: 'Book, view, and adjust upcoming visits.' },
  { to: '/om/requests', label: 'Requests', desc: 'Review patient requests that need office action.' },
  { to: '/om/dentists', label: 'Dentists', desc: 'Register dentists and monitor surgery coverage.' },
  { to: '/om/patients', label: 'Patients', desc: 'Enroll patients and spot billing blockers fast.' },
  { to: '/om/surgeries', label: 'Surgeries', desc: 'Maintain locations, addresses, and phone details.' },
  { to: '/om/bills', label: 'Billing', desc: 'Track balances and mark payments as settled.' },
]

export default function OMDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Clinic control room"
        description="Use this overview to move quickly between scheduling, intake, staff management, and billing without losing context."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Core areas" value="6" hint="Every daily office workflow is accessible from one navigation system." />
        <StatCard label="Role model" value="1" hint="Only office managers can create staff, patients, appointments, and payments." />
        <StatCard label="Design goal" value="Fast" hint="Clearer hierarchy and fewer visual dead ends across the portal." />
      </div>

      <Surface>
        <div className="mb-5">
          <h4 className="font-display text-2xl text-slate-900">Jump to a workflow</h4>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Each workspace is intentionally scoped so you can move from intake to follow-up without hunting through tabs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-[28px] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Workspace
              </p>
              <h2 className="mt-3 font-display text-2xl text-slate-900 transition group-hover:text-teal-800">
                {s.label}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{s.desc}</p>
              <p className="mt-6 text-sm font-semibold text-slate-900">Open section</p>
            </Link>
          ))}
        </div>
      </Surface>
    </div>
  )
}
