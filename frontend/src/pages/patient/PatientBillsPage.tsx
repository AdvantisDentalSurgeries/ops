import { useState, useEffect } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getBills } from '../../api/bills'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { Bill } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'

export default function PatientBillsPage() {
  const { user } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        let profileId = user?.profileId ?? null

        if (!profileId) {
          setBills([])
          setError('Your patient profile could not be resolved for billing. Please sign in again or contact the office.')
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
  }, [user?.profileId])

  const outstandingCount = bills.filter((bill) => !bill.isPaid).length
  const outstandingAmount = bills
    .filter((bill) => !bill.isPaid)
    .reduce((total, bill) => total + Number.parseFloat(bill.amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="My bills"
        description="Review due dates and balances without needing to call the office for a billing snapshot."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Bills" value={String(bills.length)} hint="All billing records available for your patient profile." />
        <StatCard label="Outstanding" value={String(outstandingCount)} hint="Bills that still need office payment processing." />
        <StatCard label="Amount due" value={formatCurrency(outstandingAmount)} hint="Current unpaid total across the bills shown here." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : bills.length === 0 ? (
          <EmptyState
            title="No bills found"
            description="You do not currently have any billing records available from the system."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Due Date', 'Amount', 'Status', 'Appointment Date', 'Dentist'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDateTime(b.appointment.dateTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {b.appointment.dentist.firstName} {b.appointment.dentist.lastName}
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
