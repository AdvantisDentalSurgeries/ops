import api from '../lib/axios'
import { Surgery, CreateSurgeryInput } from '../types'

export const getSurgeries = (): Promise<Surgery[]> =>
  api.get<Surgery[]>('/api/surgeries').then((r) => r.data)

export const createSurgery = (body: CreateSurgeryInput): Promise<Surgery> =>
  api.post<Surgery>('/api/surgeries', body).then((r) => r.data)
