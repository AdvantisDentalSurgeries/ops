import { prisma } from '../lib/prisma';

export async function getBillsByPatient(patientId: string) {
  return prisma.bill.findMany({
    where: { patientId },
    include: { appointment: { include: { dentist: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markPaid(billId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new Error('Bill not found');
  return prisma.bill.update({ where: { id: billId }, data: { isPaid: true } });
}

export async function createBill(data: {
  appointmentId: string;
  patientId: string;
  amount: number;
  dueDate: Date;
}) {
  return prisma.bill.create({ data: { ...data, amount: data.amount } });
}
