import { useState, FormEvent } from 'react'
import { AxiosError } from 'axios'
import ErrorBanner from '../../components/ErrorBanner'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import { submitRequest } from '../../api/requests'
import { RequestType } from '../../types'

function emptyForm(): { requestType: RequestType; requestedDate: string } {
  return { requestType: 'ONLINE', requestedDate: '' }
}

export default function PatientRequestPage() {
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorVariant, setErrorVariant] = useState<'error' | 'warning'>('error')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await submitRequest({
        requestType: form.requestType,
        requestedDate: new Date(form.requestedDate).toISOString(),
      })
      setSuccess(true)
      setForm(emptyForm())
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>
      const status = axiosErr.response?.status
      if (status === 403 || status === 409) {
        setError(
          'You have an outstanding unpaid bill. Please contact the office to settle your balance before requesting a new appointment.'
        )
        setErrorVariant('warning')
      } else {
        setError(axiosErr.response?.data?.error ?? 'Failed to submit request')
        setErrorVariant('error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Request"
        title="Request an appointment"
        description="Tell the office how and when you’d prefer to be seen. We’ll keep the form simple and surface billing blockers clearly."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Channel" value={form.requestType} hint="Choose whether the request should reflect an online form or phone call." />
        <StatCard label="Preferred time" value={form.requestedDate ? 'Chosen' : 'Pending'} hint="Add your preferred date and time before submitting." />
        <StatCard label="Submission" value={success ? 'Sent' : 'Ready'} hint="Successful requests reset the form and leave a visible confirmation." />
      </div>

      <Surface className="max-w-3xl">
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Your appointment request has been submitted. The office will contact you to confirm.
          </div>
        )}
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          variant={errorVariant}
        />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Request Type</label>
            <select
              value={form.requestType}
              onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value as RequestType }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="ONLINE">Online Form</option>
              <option value="PHONE">Phone Call</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Preferred Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={form.requestedDate}
              onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Surface>
    </div>
  )
}
