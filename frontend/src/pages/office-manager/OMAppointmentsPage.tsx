import { useState, useEffect, FormEvent } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getAppointments, bookAppointment, cancelAppointment } from '../../api/appointments'
import { getDentists } from '../../api/dentists'
import { getPatients } from '../../api/patients'
import { Appointment, DentistProfile, PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatDateTime } from '../../lib/format'

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

  const scheduledCount = appointments.filter((appointment) => appointment.status === 'SCHEDULED').length
  const cancelledCount = appointments.filter((appointment) => appointment.status === 'CANCELLED').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Appointments command center"
        description="Coordinate dentist availability, patient visits, and day-to-day schedule changes from one table."
        actions={
          <button
            onClick={() => setShowBookModal(true)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Appointment
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Scheduled" value={String(scheduledCount)} hint="Upcoming visits that still need normal follow-through." />
        <StatCard label="Cancelled" value={String(cancelledCount)} hint="Appointments already closed out by cancellation." />
        <StatCard label="Roster" value={`${dentists.length}/${patients.length}`} hint="Loaded dentists and patients available for new bookings." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="When the office books a visit, it will appear here with patient, dentist, surgery, and status details."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Date & Time', 'Patient', 'Dentist', 'Surgery', 'Status', 'Notes', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="align-top">
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatDateTime(a.dateTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {a.patient?.firstName ?? 'Unknown'} {a.patient?.lastName ?? 'patient'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {a.dentist?.firstName ?? 'Unknown'} {a.dentist?.lastName ?? 'dentist'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      {a.dentist?.surgery?.name ?? 'Unassigned surgery'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-600">{a.notes ?? 'No notes'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {a.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCancel(a.id)}
                          disabled={cancelLoading[a.id]}
                          className="text-xs font-semibold text-rose-700 transition hover:text-rose-900 disabled:opacity-50"
                        >
                          {cancelLoading[a.id] ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

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
            <label className="mb-2 block text-sm font-semibold text-slate-700">Dentist</label>
            <select
              required
              value={bookForm.dentistId}
              onChange={(e) => setBookForm((f) => ({ ...f, dentistId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select dentist...</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} - {d.specialization}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Patient</label>
            <select
              required
              value={bookForm.patientId}
              onChange={(e) => setBookForm((f) => ({ ...f, patientId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={bookForm.dateTime}
              onChange={(e) => setBookForm((f) => ({ ...f, dateTime: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={bookForm.notes}
              onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
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
              className="px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookLoading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {bookLoading ? 'Booking...' : 'Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
