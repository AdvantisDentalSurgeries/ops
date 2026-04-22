import nodemailer from 'nodemailer';
import { Appointment, Dentist, Patient, Surgery } from '@prisma/client';

type AppointmentForEmail = Appointment & {
  dentist: Dentist & { surgery: Surgery };
  patient: Patient;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendConfirmationToEmail(
  email: string,
  appointment: AppointmentForEmail
): Promise<void> {
  const { patient, dentist, dateTime } = appointment;
  const formattedDate = new Date(dateTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Appointment Confirmation — Dental Surgery',
    text: [
      `Dear ${patient.firstName} ${patient.lastName},`,
      '',
      `Your appointment has been confirmed for ${formattedDate}.`,
      `Dentist: Dr. ${dentist.firstName} ${dentist.lastName} (${dentist.specialization})`,
      `Location: ${dentist.surgery.name}, ${dentist.surgery.address}`,
      `Phone: ${dentist.surgery.phone}`,
      '',
      'Please arrive 10 minutes before your scheduled time.',
    ].join('\n'),
  });
}
