import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getBills } from '../../api/bills'
import { getAppointments } from '../../api/appointments'
import { useAuth } from '../../contexts/AuthContext'
import { Bill } from '../../types'
import { extractError } from '../../lib/extractError'

export default function PatientBillsPage() {
  const { user, setProfileId } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        let profileId = user?.profileId ?? null

        if (!profileId) {
          const appts = await getAppointments()
          const firstPatientId = appts[0]?.patient?.id
          if (firstPatientId) {
            setProfileId(firstPatientId)
            profileId = firstPatientId
          }
        }

        if (!profileId) {
          setBills([])
          return
        }

        const data = await getBills(profileId)
        setBills(data)
      } catch (err) {
        setError(extractError(err))
      } finally {
        setLoading(false)
      }
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Bills</h1>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : bills.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No bills found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Due Date', 'Amount', 'Status', 'Appointment Date', 'Dentist'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(b.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      ${parseFloat(b.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          b.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {b.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(b.appointment.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.appointment.dentist.firstName} {b.appointment.dentist.lastName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
