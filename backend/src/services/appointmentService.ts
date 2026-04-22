import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendConfirmationToEmail } from './emailService';

function getIsoWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export async function isWeeklyLimitReached(dentistId: string, date: Date): Promise<boolean> {
  const { start, end } = getIsoWeekBounds(date);
  const count = await prisma.appointment.count({
    where: {
      dentistId,
      dateTime: { gte: start, lte: end },
      status: { not: AppointmentStatus.CANCELLED },
    },
  });
  return count >= 5;
}

export async function getAppointments(userId: string, role: string) {
  if (role === 'OFFICE_MANAGER') {
    return prisma.appointment.findMany({
      include: {
        dentist: { include: { surgery: true, user: true } },
        patient: { include: { user: true } },
        bill: true,
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  if (role === 'DENTIST') {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (!dentist) return [];
    return prisma.appointment.findMany({
      where: { dentistId: dentist.id },
      include: {
        dentist: { include: { surgery: true } },
        patient: { include: { user: true } },
        bill: true,
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  // PATIENT
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) return [];
  return prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      dentist: { include: { surgery: true, user: true } },
      patient: true,
      bill: true,
    },
    orderBy: { dateTime: 'asc' },
  });
}

export async function bookAppointment(data: {
  dentistId: string;
  patientId: string;
  dateTime: Date;
  notes?: string;
  requestId?: string;
}) {
  const limitReached = await isWeeklyLimitReached(data.dentistId, data.dateTime);
  if (limitReached) {
    throw new RangeError('Dentist already has 5 appointments this week');
  }

  const appointment = await prisma.appointment.create({
    data: {
      dentistId: data.dentistId,
      patientId: data.patientId,
      dateTime: data.dateTime,
      notes: data.notes,
      ...(data.requestId && {
        request: { connect: { id: data.requestId } },
      }),
    },
    include: {
      dentist: { include: { surgery: true } },
      patient: { include: { user: true } },
    },
  });

  const patientEmail = appointment.patient.user.email;
  sendConfirmationToEmail(patientEmail, appointment).catch(() => {
    // Non-fatal: email delivery failure should not roll back the booking
  });

  return appointment;
}

export async function cancelAppointment(id: string, userId: string, role: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { dentist: true, patient: true },
  });
  if (!appointment) throw new Error('Appointment not found');

  if (role === 'DENTIST') {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (!dentist || dentist.id !== appointment.dentistId) throw new Error('Forbidden');
  } else if (role === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== appointment.patientId) throw new Error('Forbidden');
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
  });
}

export async function rescheduleAppointment(
  id: string,
  newDateTime: Date,
  userId: string,
  role: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { dentist: true, patient: true },
  });
  if (!appointment) throw new Error('Appointment not found');

  if (role === 'DENTIST') {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (!dentist || dentist.id !== appointment.dentistId) throw new Error('Forbidden');
  } else if (role === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== appointment.patientId) throw new Error('Forbidden');
  }

  const limitReached = await isWeeklyLimitReached(appointment.dentistId, newDateTime);
  if (limitReached) {
    throw new RangeError('Dentist already has 5 appointments in the target week');
  }

  return prisma.appointment.update({
    where: { id },
    data: { dateTime: newDateTime },
  });
}
