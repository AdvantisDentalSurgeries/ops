import { useState, FormEvent } from 'react'
import { AxiosError } from 'axios'
import NavBar from '../../components/NavBar'
import ErrorBanner from '../../components/ErrorBanner'
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Request an Appointment</h1>

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Your appointment request has been submitted. The office will contact you to confirm.
          </div>
        )}

        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          variant={errorVariant}
        />

        <div className="bg-white rounded-lg shadow p-6 mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
              <select
                value={form.requestType}
                onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value as RequestType }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="ONLINE">Online Form</option>
                <option value="PHONE">Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={form.requestedDate}
                onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
