import api from '../lib/axios'
import { Bill } from '../types'

export const getBills = (patientId: string): Promise<Bill[]> =>
  api.get<Bill[]>(`/api/bills/${patientId}`).then((r) => r.data)

export const markBillPaid = (billId: string): Promise<Bill> =>
  api.put<Bill>(`/api/bills/${billId}/pay`).then((r) => r.data)
