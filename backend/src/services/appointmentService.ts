import { Appointment } from '../models/Appointment';
import { Dentist } from '../models/Dentist';
import { Patient } from '../models/Patient';
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
  const count = await Appointment.countDocuments({
    dentistId,
    dateTime: { $gte: start, $lte: end },
    status: { $ne: 'CANCELLED' },
  });
  return count >= 5;
}

export async function getAppointments(userId: string, role: string) {
  if (role === 'OFFICE_MANAGER') {
    return Appointment.find()
      .populate({ path: 'dentistId', populate: [{ path: 'surgeryId' }, { path: 'userId' }] })
      .populate({ path: 'patientId', populate: { path: 'userId' } })
      .sort({ dateTime: 1 });
  }

  if (role === 'DENTIST') {
    const dentist = await Dentist.findOne({ userId });
    if (!dentist) return [];
    return Appointment.find({ dentistId: dentist._id })
      .populate({ path: 'dentistId', populate: { path: 'surgeryId' } })
      .populate({ path: 'patientId', populate: { path: 'userId' } })
      .sort({ dateTime: 1 });
  }

  // PATIENT
  const patient = await Patient.findOne({ userId });
  if (!patient) return [];
  return Appointment.find({ patientId: patient._id })
    .populate({ path: 'dentistId', populate: [{ path: 'surgeryId' }, { path: 'userId' }] })
    .populate('patientId')
    .sort({ dateTime: 1 });
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

  const appointment = await Appointment.create({
    dentistId: data.dentistId,
    patientId: data.patientId,
    dateTime: data.dateTime,
    notes: data.notes,
    ...(data.requestId && { appointmentRequestId: data.requestId }),
  });

  const populated = await appointment.populate([
    { path: 'dentistId', populate: { path: 'surgeryId' } },
    { path: 'patientId', populate: { path: 'userId' } },
  ]);

  const patientEmail = (populated.patientId as any).userId?.email;
  if (patientEmail) {
    sendConfirmationToEmail(patientEmail, populated).catch(() => {
      // Non-fatal: email delivery failure should not roll back the booking
    });
  }

  return populated;
}

export async function cancelAppointment(id: string, userId: string, role: string) {
  const appointment = await Appointment.findById(id)
    .populate('dentistId')
    .populate('patientId');
  if (!appointment) throw new Error('Appointment not found');

  if (role === 'DENTIST') {
    const dentist = await Dentist.findOne({ userId });
    if (!dentist || dentist._id.toString() !== appointment.dentistId.toString()) {
      throw new Error('Forbidden');
    }
  } else if (role === 'PATIENT') {
    const patient = await Patient.findOne({ userId });
    if (!patient || patient._id.toString() !== appointment.patientId.toString()) {
      throw new Error('Forbidden');
    }
  }

  return Appointment.findByIdAndUpdate(id, { status: 'CANCELLED' }, { new: true });
}

export async function rescheduleAppointment(
  id: string,
  newDateTime: Date,
  userId: string,
  role: string
) {
  const appointment = await Appointment.findById(id)
    .populate('dentistId')
    .populate('patientId');
  if (!appointment) throw new Error('Appointment not found');

  if (role === 'DENTIST') {
    const dentist = await Dentist.findOne({ userId });
    if (!dentist || dentist._id.toString() !== appointment.dentistId.toString()) {
      throw new Error('Forbidden');
    }
  } else if (role === 'PATIENT') {
    const patient = await Patient.findOne({ userId });
    if (!patient || patient._id.toString() !== appointment.patientId.toString()) {
      throw new Error('Forbidden');
    }
  }

  const limitReached = await isWeeklyLimitReached(appointment.dentistId.toString(), newDateTime);
  if (limitReached) {
    throw new RangeError('Dentist already has 5 appointments in the target week');
  }

  return Appointment.findByIdAndUpdate(id, { dateTime: newDateTime }, { new: true });
}
