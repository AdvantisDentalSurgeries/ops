import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Surface from '../../components/Surface'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getPatients } from '../../api/patients'
import { registerApi } from '../../api/auth'
import { PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'
import { formatDate } from '../../lib/format'

function emptyForm() {
  return { email: '', password: '', firstName: '', lastName: '', phone: '', address: '', dateOfBirth: '' }
}

export default function OMPatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleEnroll(e: FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      await registerApi({
        ...form,
        role: 'PATIENT',
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
      })
      const updated = await getPatients()
      setPatients(updated)
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
    type = 'text'
  ) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
      />
    </div>
  )

  const unpaidPatients = patients.filter((patient) => patient.bills.some((bill) => !bill.isPaid)).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patients"
        title="Patient enrollment and billing readiness"
        description="Bring new patients into the system and spot outstanding balances before they affect scheduling."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Enroll Patient
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Patients" value={String(patients.length)} hint="Currently enrolled patient profiles returned to the office." />
        <StatCard label="With balances" value={String(unpaidPatients)} hint="Patients with at least one unpaid bill that may block new requests." />
        <StatCard label="Clean standing" value={String(patients.length - unpaidPatients)} hint="Patients without unpaid balances on record." />
      </div>

      <Surface>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patients enrolled yet"
            description="Once a patient is enrolled by the office, their profile and billing signals will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  {['Name', 'Email', 'Phone', 'DOB', 'Address', 'Unpaid Bills', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const unpaidCount = p.bills.filter((b) => !b.isPaid).length
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{p.user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{p.phone}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatDate(p.dateOfBirth)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{p.address}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {unpaidCount > 0 ? (
                          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                            {unpaidCount} unpaid
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/om/bills?patientId=${p.id}`)}
                          className="text-xs font-semibold text-teal-800 transition hover:text-teal-950"
                        >
                          View Bills
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <Modal
        isOpen={showModal}
        title="Enroll Patient"
        onClose={() => {
          setShowModal(false)
          setFormError(null)
          setForm(emptyForm())
        }}
      >
        <form onSubmit={handleEnroll} className="space-y-3">
          <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
          {field('Email', 'email', 'email')}
          {field('Password', 'password', 'password')}
          {field('First Name', 'firstName')}
          {field('Last Name', 'lastName')}
          {field('Phone', 'phone')}
          {field('Address', 'address')}
          {field('Date of Birth', 'dateOfBirth', 'date')}
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
              {formLoading ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
