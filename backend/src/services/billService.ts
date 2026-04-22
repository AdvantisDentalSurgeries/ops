import { Bill } from '../models/Bill';

export async function getBillsByPatient(patientId: string) {
  return Bill.find({ patientId })
    .populate({ path: 'appointmentId', populate: { path: 'dentistId' } })
    .sort({ createdAt: -1 });
}

export async function markPaid(billId: string) {
  const bill = await Bill.findById(billId);
  if (!bill) throw new Error('Bill not found');
  return Bill.findByIdAndUpdate(billId, { isPaid: true }, { new: true });
}

export async function createBill(data: {
  appointmentId: string;
  patientId: string;
  amount: number;
  dueDate: Date;
}) {
  return Bill.create(data);
}
