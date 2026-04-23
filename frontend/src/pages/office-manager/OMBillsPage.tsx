import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getBills, markBillPaid } from '../../api/bills'
import { getPatients } from '../../api/patients'
import { Bill, PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'

export default function OMBillsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') ?? '')
  const [loading, setLoading] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payLoading, setPayLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(extractError(err)))
      .finally(() => setPatientsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPatientId) {
      setBills([])
      return
    }
    setLoading(true)
    setError(null)
    getBills(selectedPatientId)
      .then(setBills)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [selectedPatientId])

  function handlePatientChange(id: string) {
    setSelectedPatientId(id)
    if (id) setSearchParams({ patientId: id })
    else setSearchParams({})
  }

  async function handlePay(billId: string) {
    setPayLoading((prev) => ({ ...prev, [billId]: true }))
    try {
      await markBillPaid(billId)
      setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, isPaid: true } : b)))
    } catch (err) {
      setError(extractError(err))
    } finally {
      setPayLoading((prev) => ({ ...prev, [billId]: false }))
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const outstandingCount = bills.filter((bill) => !bill.isPaid).length
  const outstandingAmount = bills
    .filter((bill) => !bill.isPaid)
    .reduce((total, bill) => total + Number.parseFloat(bill.amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Patient balances"
        description="Review balances by patient, settle bills, and keep the appointment pipeline clear of payment blockers."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Selected patient" value={selectedPatient ? `${selectedPatient.firstName}` : 'None'} hint="Choose a patient to load their bill history." />
        <StatCard label="Outstanding bills" value={String(outstandingCount)} hint="Open balances currently visible in the selected patient view." />
        <StatCard label="Outstanding amount" value={formatCurrency(outstandingAmount)} hint="Total unpaid amount across the bills in the current selection." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Select Patient</label>
          {patientsLoading ? (
            <div className="text-sm text-slate-400">Loading patients...</div>
          ) : (
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedPatient && (
          <p className="mb-4 text-sm text-slate-600">
            Showing bills for <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
          </p>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : !selectedPatientId ? (
          <EmptyState
            title="Pick a patient to begin"
            description="Select a patient from the directory to review bill status, due dates, and payment actions."
          />
        ) : bills.length === 0 ? (
          <EmptyState
            title="No bills for this patient"
            description="This patient does not currently have any bill records returned by the API."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Due Date', 'Amount', 'Status', 'Appointment Date', 'Dentist', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(b.dueDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          b.isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                      {formatDateTime(b.appointment.dateTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {b.appointment.dentist.firstName} {b.appointment.dentist.lastName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {!b.isPaid && (
                        <button
                          onClick={() => handlePay(b.id)}
                          disabled={payLoading[b.id]}
                          className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 disabled:opacity-50"
                        >
                          {payLoading[b.id] ? 'Processing...' : 'Mark Paid'}
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
    </div>
  )
}
