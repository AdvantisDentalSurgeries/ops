import { useState, useEffect, FormEvent } from 'react'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import { getAppointments, bookAppointment, cancelAppointment } from '../../api/appointments'
import { getDentists } from '../../api/dentists'
import { getPatients } from '../../api/patients'
import { Appointment, DentistProfile, PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

function emptyBookForm() {
  return { dentistId: '', patientId: '', dateTime: '', notes: '' }
}

export default function OMAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dentists, setDentists] = useState<DentistProfile[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookForm, setBookForm] = useState(emptyBookForm())
  const [bookError, setBookError] = useState<string | null>(null)
  const [bookLoading, setBookLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([getAppointments(), getDentists(), getPatients()])
      .then(([appts, dents, pats]) => {
        setAppointments(appts)
        setDentists(dents)
        setPatients(pats)
      })
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

  async function handleBook(e: FormEvent) {
    e.preventDefault()
    setBookLoading(true)
    setBookError(null)
    try {
      const newAppt = await bookAppointment({
        dentistId: bookForm.dentistId,
        patientId: bookForm.patientId,
        dateTime: new Date(bookForm.dateTime).toISOString(),
        notes: bookForm.notes || undefined,
      })
      setAppointments((prev) => [newAppt, ...prev])
      setShowBookModal(false)
      setBookForm(emptyBookForm())
    } catch (err) {
      setBookError(extractError(err))
    } finally {
      setBookLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Book Appointment
          </button>
        </div>

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
                  {['Date & Time', 'Patient', 'Dentist', 'Surgery', 'Status', 'Notes', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(a.dateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.patient.firstName} {a.patient.lastName}
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCancel(a.id)}
                          disabled={cancelLoading[a.id]}
                          className="text-red-600 hover:underline text-xs disabled:opacity-50"
                        >
                          {cancelLoading[a.id] ? 'Cancelling…' : 'Cancel'}
                        </button>
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
        isOpen={showBookModal}
        title="Book Appointment"
        onClose={() => {
          setShowBookModal(false)
          setBookError(null)
          setBookForm(emptyBookForm())
        }}
      >
        <form onSubmit={handleBook} className="space-y-4">
          <ErrorBanner message={bookError} onDismiss={() => setBookError(null)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dentist</label>
            <select
              required
              value={bookForm.dentistId}
              onChange={(e) => setBookForm((f) => ({ ...f, dentistId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select dentist…</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} — {d.specialization}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              required
              value={bookForm.patientId}
              onChange={(e) => setBookForm((f) => ({ ...f, patientId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={bookForm.dateTime}
              onChange={(e) => setBookForm((f) => ({ ...f, dateTime: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={bookForm.notes}
              onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowBookModal(false)
                setBookError(null)
                setBookForm(emptyBookForm())
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {bookLoading ? 'Booking…' : 'Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
