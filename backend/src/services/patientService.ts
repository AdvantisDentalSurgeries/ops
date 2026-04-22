import { Patient } from '../models/Patient';
import { Bill } from '../models/Bill';

export async function hasUnpaidBills(patientId: string): Promise<boolean> {
  const count = await Bill.countDocuments({ patientId, isPaid: false });
  return count > 0;
}

export async function getPatients() {
  return Patient.find()
    .populate('userId')
    .populate('bills')
    .sort({ lastName: 1, firstName: 1 });
}

export async function enrollPatient(data: {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
}) {
  const patient = await Patient.create(data);
  return patient.populate('userId');
}
