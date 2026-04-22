import { prisma } from '../lib/prisma';

export async function getDentists() {
  return prisma.dentist.findMany({
    include: { user: true, surgery: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

export async function registerDentist(data: {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  surgeryId: string;
}) {
  return prisma.dentist.create({ data, include: { user: true, surgery: true } });
}
