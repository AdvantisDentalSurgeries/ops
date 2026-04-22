import { Link } from 'react-router-dom'
import NavBar from '../../components/NavBar'

const sections = [
  { to: '/om/appointments', label: 'Appointments', desc: 'Book, view, and cancel appointments' },
  { to: '/om/requests', label: 'Requests', desc: 'View patient appointment requests' },
  { to: '/om/dentists', label: 'Dentists', desc: 'Register and view dentists' },
  { to: '/om/patients', label: 'Patients', desc: 'Enroll and view patients' },
  { to: '/om/surgeries', label: 'Surgeries', desc: 'Manage surgery locations' },
  { to: '/om/bills', label: 'Bills', desc: 'View and mark bills as paid' },
]

export default function OMDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Office Manager Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-blue-700 mb-1">{s.label}</h2>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
