import { RequestType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hasUnpaidBills } from './patientService';

export async function getRequests() {
  return prisma.appointmentRequest.findMany({
    include: { patient: { include: { user: true } }, appointment: true },
    orderBy: { createdAt: 'desc' },
  });
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

  return prisma.appointmentRequest.create({
    data,
    include: { patient: true },
  });
}
