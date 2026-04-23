import api from '../lib/axios'
import { AppointmentRequest, SubmitRequestInput } from '../types'
import { normalizeAppointmentRequest } from './normalize'

export const getRequests = (): Promise<AppointmentRequest[]> =>
  api.get('/api/requests').then((r) => r.data.map(normalizeAppointmentRequest))

export const submitRequest = (body: SubmitRequestInput): Promise<AppointmentRequest> =>
  api.post('/api/requests', body).then((r) => normalizeAppointmentRequest(r.data))
