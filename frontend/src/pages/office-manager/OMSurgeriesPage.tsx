import { useState, useEffect, FormEvent } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getSurgeries, createSurgery } from '../../api/surgeries'
import { Surgery } from '../../types'
import { extractError } from '../../lib/extractError'

function emptyForm() {
  return { name: '', address: '', phone: '' }
}

export default function OMSurgeriesPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    getSurgeries()
      .then(setSurgeries)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      const newSurgery = await createSurgery(form)
      setSurgeries((prev) => [...prev, newSurgery])
      setShowModal(false)
      setForm(emptyForm())
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Locations"
        title="Surgery directory"
        description="Maintain the locations where dentists practice so scheduling and staffing stay grounded in real site data."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Surgery
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Locations" value={String(surgeries.length)} hint="Every listed surgery can be assigned to staff during registration." />
        <StatCard label="Directory" value="Ready" hint="Addresses and phone numbers are visible for fast office reference." />
        <StatCard label="Coverage" value="Live" hint="Keep the clinic footprint updated before bookings are made." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : surgeries.length === 0 ? (
          <EmptyState
            title="No surgeries found"
            description="Add your first surgery location so dentists can be assigned to a valid practice site."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Name', 'Address', 'Phone'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surgeries.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-4 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-4 text-slate-600">{s.address}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{s.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <Modal
        isOpen={showModal}
        title="Add Surgery"
        onClose={() => {
          setShowModal(false)
          setFormError(null)
          setForm(emptyForm())
        }}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
          {(['name', 'address', 'phone'] as const).map((key) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-semibold capitalize text-slate-700">
                {key}
              </label>
              <input
                type="text"
                required
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setFormError(null)
                setForm(emptyForm())
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {formLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
