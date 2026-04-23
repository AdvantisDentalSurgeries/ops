import { useState, useEffect, FormEvent } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getDentists } from '../../api/dentists'
import { getSurgeries } from '../../api/surgeries'
import { registerApi } from '../../api/auth'
import { DentistProfile, Surgery } from '../../types'
import { extractError } from '../../lib/extractError'

function emptyForm() {
  return { email: '', password: '', firstName: '', lastName: '', phone: '', specialization: '', surgeryId: '' }
}

export default function OMDentistsPage() {
  const [dentists, setDentists] = useState<DentistProfile[]>([])
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    Promise.all([getDentists(), getSurgeries()])
      .then(([dents, surgs]) => {
        setDentists(dents)
        setSurgeries(surgs)
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      await registerApi({ ...form, role: 'DENTIST' })
      const updated = await getDentists()
      setDentists(updated)
      setShowModal(false)
      setForm(emptyForm())
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setFormLoading(false)
    }
  }

  const field = (
    label: string,
    key: keyof ReturnType<typeof emptyForm>,
    type = 'text',
    required = true
  ) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
      />
    </div>
  )

  const uniqueSurgeries = new Set(
    dentists.map((dentist) => dentist.surgery?.id).filter(Boolean)
  ).size

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staffing"
        title="Dentist roster"
        description="Register clinicians, confirm specializations, and keep surgery assignments visible at a glance."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Register Dentist
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Dentists" value={String(dentists.length)} hint="Active dentists currently available to book in the system." />
        <StatCard label="Surgeries used" value={String(uniqueSurgeries)} hint="Distinct practice locations already assigned across the roster." />
        <StatCard label="Locations loaded" value={String(surgeries.length)} hint="Available surgeries the office can assign during registration." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : dentists.length === 0 ? (
          <EmptyState
            title="No dentists registered yet"
            description="Use the registration flow to add a dentist with specialization and surgery assignment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Name', 'Email', 'Phone', 'Specialization', 'Surgery', 'Address'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dentists.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                      {d.firstName} {d.lastName}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{d.user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{d.phone}</td>
                    <td className="px-4 py-4">{d.specialization}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{d.surgery.name}</td>
                    <td className="px-4 py-4 text-slate-600">{d.surgery.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <Modal
        isOpen={showModal}
        title="Register Dentist"
        onClose={() => {
          setShowModal(false)
          setFormError(null)
          setForm(emptyForm())
        }}
      >
        <form onSubmit={handleRegister} className="space-y-3">
          <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
          {field('Email', 'email', 'email')}
          {field('Password', 'password', 'password')}
          {field('First Name', 'firstName')}
          {field('Last Name', 'lastName')}
          {field('Phone', 'phone')}
          {field('Specialization', 'specialization')}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Surgery</label>
            <select
              required
              value={form.surgeryId}
              onChange={(e) => setForm((f) => ({ ...f, surgeryId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select surgery...</option>
              {surgeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
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
              {formLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
