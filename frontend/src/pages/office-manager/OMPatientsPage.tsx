import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorBanner from '../../components/ErrorBanner'
import Modal from '../../components/Modal'
import { getPatients } from '../../api/patients'
import { registerApi } from '../../api/auth'
import { PatientProfile } from '../../types'
import { extractError } from '../../lib/extractError'

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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        required
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
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Enroll Patient
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingSpinner />
        ) : patients.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No patients enrolled yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'DOB', 'Address', 'Unpaid Bills', 'Actions'].map(
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
                {patients.map((p) => {
                  const unpaidCount = p.bills.filter((b) => !b.isPaid).length
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.user.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(p.dateOfBirth).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.address}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {unpaidCount > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {unpaidCount} unpaid
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() =>
                            navigate(`/om/bills?patientId=${p.id}`)
                          }
                          className="text-blue-600 hover:underline text-xs"
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
      </main>

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
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {formLoading ? 'Enrolling…' : 'Enroll'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
