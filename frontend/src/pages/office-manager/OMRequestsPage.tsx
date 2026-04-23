import { useState, useEffect } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getRequests } from '../../api/requests'
import { AppointmentRequest } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatDateTime } from '../../lib/format'

export default function OMRequestsPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  const onlineCount = requests.filter((request) => request.requestType === 'ONLINE').length
  const phoneCount = requests.length - onlineCount

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intake"
        title="Incoming appointment requests"
        description="Triage patient demand quickly, with a cleaner read on preferred dates and request channels."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total" value={String(requests.length)} hint="All requests currently returned by the office queue." />
        <StatCard label="Online" value={String(onlineCount)} hint="Self-serve requests submitted directly by patients." />
        <StatCard label="Phone" value={String(phoneCount)} hint="Requests logged from phone-based patient outreach." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No pending requests"
            description="Once patients start submitting appointment requests, the office queue will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Patient', 'Email', 'Type', 'Requested Date'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                      {r.patient.firstName} {r.patient.lastName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      {r.patient.user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.requestType === 'ONLINE'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.requestType}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                      {formatDateTime(r.requestedDate)}
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
