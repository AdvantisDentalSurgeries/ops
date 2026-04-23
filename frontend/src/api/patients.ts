import api from '../lib/axios'
import { PatientProfile } from '../types'
import { normalizePatientProfile } from './normalize'

export const getPatients = (): Promise<PatientProfile[]> =>
  api.get('/api/patients').then((r) => r.data.map(normalizePatientProfile))
