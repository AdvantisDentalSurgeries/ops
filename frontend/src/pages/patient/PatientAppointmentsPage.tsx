import { useState, useEffect, FormEvent } from 'react'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import { getAppointments, cancelAppointment, rescheduleAppointment } from '../../api/appointments'
import { Appointment } from '../../types'
import { extractError } from '../../lib/extractError'

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newDateTime, setNewDateTime] = useState('')
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id: string) {
    if (!window.confirm('Cancel this appointment?')) return
    setCancelLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await cancelAppointment(id)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
      )
    } catch (err) {
      setError(extractError(err))
    } finally {
      setCancelLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  async function handleReschedule(e: FormEvent) {
    e.preventDefault()
    if (!rescheduleId) return
    setRescheduleLoading(true)
    setRescheduleError(null)
    try {
      const updated = await rescheduleAppointment(
        rescheduleId,
        new Date(newDateTime).toISOString()
      )
      setAppointments((prev) =>
        prev.map((a) => (a.id === rescheduleId ? { ...a, dateTime: updated.dateTime } : a))
      )
      setRescheduleId(null)
      setNewDateTime('')
    } catch (err) {
      setRescheduleError(extractError(err))
    } finally {
      setRescheduleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No appointments found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date & Time', 'Dentist', 'Surgery', 'Status', 'Notes', 'Actions'].map((h) => (
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
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(a.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.dentist.firstName} {a.dentist.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{a.dentist.surgery.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{a.notes ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-3">
                      {a.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleCancel(a.id)}
                            disabled={cancelLoading[a.id]}
                            className="text-red-600 hover:underline text-xs disabled:opacity-50"
                          >
                            {cancelLoading[a.id] ? 'Cancelling…' : 'Cancel'}
                          </button>
                          <button
                            onClick={() => {
                              setRescheduleId(a.id)
                              setNewDateTime('')
                              setRescheduleError(null)
                            }}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Reschedule
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal
        isOpen={rescheduleId !== null}
        title="Reschedule Appointment"
        onClose={() => {
          setRescheduleId(null)
          setRescheduleError(null)
          setNewDateTime('')
        }}
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <ErrorBanner message={rescheduleError} onDismiss={() => setRescheduleError(null)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time</label>
            <input
              type="datetime-local"
              required
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRescheduleId(null)
                setRescheduleError(null)
                setNewDateTime('')
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {rescheduleLoading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
