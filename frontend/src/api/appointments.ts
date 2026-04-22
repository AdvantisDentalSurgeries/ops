import api from '../lib/axios'
import { Appointment } from '../types'

export const getAppointments = (): Promise<Appointment[]> =>
  api.get<Appointment[]>('/api/appointments').then((r) => r.data)

export const bookAppointment = (body: {
  dentistId: string
  patientId: string
  dateTime: string
  notes?: string
}): Promise<Appointment> =>
  api.post<Appointment>('/api/appointments', body).then((r) => r.data)

export const cancelAppointment = (id: string): Promise<Appointment> =>
  api.put<Appointment>(`/api/appointments/${id}/cancel`).then((r) => r.data)

export const rescheduleAppointment = (id: string, dateTime: string): Promise<Appointment> =>
  api.put<Appointment>(`/api/appointments/${id}/reschedule`, { dateTime }).then((r) => r.data)
