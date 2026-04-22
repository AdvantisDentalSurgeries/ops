import nodemailer from 'nodemailer';

interface Surgery {
  name: string;
  address: string;
  phone: string;
}

interface DentistForEmail {
  firstName: string;
  lastName: string;
  specialization: string;
  surgeryId: Surgery;
}

interface PatientForEmail {
  firstName: string;
  lastName: string;
}

export interface AppointmentForEmail {
  dateTime: Date;
  dentistId: DentistForEmail;
  patientId: PatientForEmail;
}

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
  const { patientId: patient, dentistId: dentist, dateTime } = appointment;
  const surgery = dentist.surgeryId;
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
      `Location: ${surgery.name}, ${surgery.address}`,
      `Phone: ${surgery.phone}`,
      '',
      'Please arrive 10 minutes before your scheduled time.',
    ].join('\n'),
  });
}
