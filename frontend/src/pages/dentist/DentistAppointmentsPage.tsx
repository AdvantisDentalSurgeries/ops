import { useState, useEffect, FormEvent } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getAppointments, cancelAppointment, rescheduleAppointment } from '../../api/appointments'
import { Appointment } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatDateTime } from '../../lib/format'

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

export default function DentistAppointmentsPage() {
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

  const scheduledCount = appointments.filter((appointment) => appointment.status === 'SCHEDULED').length
  const completedCount = appointments.filter((appointment) => appointment.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chairside"
        title="My appointment schedule"
        description="Track upcoming patient visits and handle cancellations or rescheduling without leaving the schedule view."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Scheduled" value={String(scheduledCount)} hint="Upcoming appointments still on your chairside plan." />
        <StatCard label="Completed" value={String(completedCount)} hint="Visits already completed and retained in the record." />
        <StatCard label="Total" value={String(appointments.length)} hint="All appointments currently returned for your user account." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments found"
            description="Once the office schedules visits for you, they will appear here with patient and surgery details."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Date & Time', 'Patient', 'Surgery', 'Status', 'Notes', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatDateTime(a.dateTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {a.patient?.firstName ?? 'Unknown'} {a.patient?.lastName ?? 'patient'}
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
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleCancel(a.id)}
                            disabled={cancelLoading[a.id]}
                            className="text-xs font-semibold text-rose-700 transition hover:text-rose-900 disabled:opacity-50"
                          >
                            {cancelLoading[a.id] ? 'Cancelling...' : 'Cancel'}
                          </button>
                          <button
                            onClick={() => {
                              setRescheduleId(a.id)
                              setNewDateTime('')
                              setRescheduleError(null)
                            }}
                            className="text-xs font-semibold text-teal-800 transition hover:text-teal-950"
                          >
                            Reschedule
                          </button>
                        </div>
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
            <label className="mb-2 block text-sm font-semibold text-slate-700">New Date & Time</label>
            <input
              type="datetime-local"
              required
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
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
              className="px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleLoading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {rescheduleLoading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
