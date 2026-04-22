import { useState, useEffect, FormEvent } from 'react'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dentists</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Register Dentist
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : dentists.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No dentists registered yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Specialization', 'Surgery', 'Address'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dentists.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {d.firstName} {d.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.phone}</td>
                    <td className="px-4 py-3">{d.specialization}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.surgery.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.surgery.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Surgery</label>
            <select
              required
              value={form.surgeryId}
              onChange={(e) => setForm((f) => ({ ...f, surgeryId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select surgery…</option>
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
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {formLoading ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
