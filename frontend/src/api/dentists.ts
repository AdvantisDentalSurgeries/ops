import api from '../lib/axios'
import { DentistProfile } from '../types'
import { normalizeDentistProfile } from './normalize'

export const getDentists = (): Promise<DentistProfile[]> =>
  api.get('/api/dentists').then((r) => r.data.map(normalizeDentistProfile))
