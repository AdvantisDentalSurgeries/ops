import api from '../lib/axios'
import { Bill } from '../types'
import { normalizeBill } from './normalize'

export const getBills = (patientId: string): Promise<Bill[]> =>
  api.get(`/api/bills/${patientId}`).then((r) => r.data.map(normalizeBill))

export const markBillPaid = (billId: string): Promise<Bill> =>
  api.put(`/api/bills/${billId}/pay`).then((r) => normalizeBill(r.data))
