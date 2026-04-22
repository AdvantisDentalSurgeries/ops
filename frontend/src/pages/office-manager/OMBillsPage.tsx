import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getBills, markBillPaid } from '../../api/bills'
import { getPatients } from '../../api/patients'
import { Bill, PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Bills</h1>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
          {patientsLoading ? (
            <div className="text-sm text-gray-400">Loading patients…</div>
          ) : (
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm"
            >
              <option value="">Choose a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedPatient && (
          <p className="text-sm text-gray-500 mb-4">
            Showing bills for <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
          </p>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : !selectedPatientId ? (
          <p className="text-gray-400 text-center py-12">Select a patient to view their bills.</p>
        ) : bills.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No bills found for this patient.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Due Date', 'Amount', 'Status', 'Appointment Date', 'Dentist', 'Actions'].map(
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!b.isPaid && (
                        <button
                          onClick={() => handlePay(b.id)}
                          disabled={payLoading[b.id]}
                          className="text-green-700 hover:underline text-xs disabled:opacity-50"
                        >
                          {payLoading[b.id] ? 'Processing…' : 'Mark Paid'}
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
    </div>
  )
}
