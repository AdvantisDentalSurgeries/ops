import { prisma } from '../lib/prisma';

export async function hasUnpaidBills(patientId: string): Promise<boolean> {
  const count = await prisma.bill.count({
    where: { patientId, isPaid: false },
  });
  return count > 0;
}

export async function getPatients() {
  return prisma.patient.findMany({
    include: { user: true, bills: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

export async function enrollPatient(data: {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
}) {
  return prisma.patient.create({ data, include: { user: true } });
}
