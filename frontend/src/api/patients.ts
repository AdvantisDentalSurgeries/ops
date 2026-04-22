import api from '../lib/axios'
import { PatientProfile } from '../types'

export const getPatients = (): Promise<PatientProfile[]> =>
  api.get<PatientProfile[]>('/api/patients').then((r) => r.data)
