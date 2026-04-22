import { AppointmentRequest } from '../models/AppointmentRequest';
import { hasUnpaidBills } from './patientService';
import type { RequestType } from '../types';

export async function getRequests() {
  return AppointmentRequest.find()
    .populate({ path: 'patientId', populate: { path: 'userId' } })
    .populate('appointmentId')
    .sort({ createdAt: -1 });
}

export async function createRequest(data: {
  patientId: string;
  requestType: RequestType;
  requestedDate: Date;
}) {
  const blocked = await hasUnpaidBills(data.patientId);
  if (blocked) {
    throw new Error('UNPAID_BILL');
  }

  const req = await AppointmentRequest.create(data);
  return req.populate('patientId');
}
