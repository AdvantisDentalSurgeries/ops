import api from '../lib/axios'
import { AppointmentRequest, SubmitRequestInput } from '../types'

export const getRequests = (): Promise<AppointmentRequest[]> =>
  api.get<AppointmentRequest[]>('/api/requests').then((r) => r.data)

export const submitRequest = (body: SubmitRequestInput): Promise<AppointmentRequest> =>
  api.post<AppointmentRequest>('/api/requests', body).then((r) => r.data)
