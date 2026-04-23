import api from '../lib/axios'
import { Appointment } from '../types'
import { normalizeAppointment } from './normalize'

export const getAppointments = (): Promise<Appointment[]> =>
  api.get('/api/appointments').then((r) => r.data.map(normalizeAppointment))

export const bookAppointment = (body: {
  dentistId: string
  patientId: string
  dateTime: string
  notes?: string
}): Promise<Appointment> =>
  api.post('/api/appointments', body).then((r) => normalizeAppointment(r.data))

export const cancelAppointment = (id: string): Promise<Appointment> =>
  api.put(`/api/appointments/${id}/cancel`).then((r) => normalizeAppointment(r.data))

export const rescheduleAppointment = (id: string, dateTime: string): Promise<Appointment> =>
  api.put(`/api/appointments/${id}/reschedule`, { dateTime }).then((r) => normalizeAppointment(r.data))
