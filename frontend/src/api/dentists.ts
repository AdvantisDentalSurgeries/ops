import api from '../lib/axios'
import { DentistProfile } from '../types'

export const getDentists = (): Promise<DentistProfile[]> =>
  api.get<DentistProfile[]>('/api/dentists').then((r) => r.data)
