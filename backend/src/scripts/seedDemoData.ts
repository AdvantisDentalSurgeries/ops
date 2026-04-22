import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import { User } from '../models/User';
import { Surgery } from '../models/Surgery';
import { Dentist } from '../models/Dentist';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { AppointmentRequest } from '../models/AppointmentRequest';
import { Bill } from '../models/Bill';
import type { AppointmentStatus, RequestType, Role } from '../types';

const DEMO_DOMAIN = 'demo.dental.local';
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_SURGERY_NAMES = [
  'Bright Smiles Cedar Falls',
  'Riverbend Dental Waterloo',
  'Downtown Family Dental Waverly',
];

type DentistSeed = {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  surgeryName: string;
};

type PatientSeed = {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
};

type EntityRef = {
  _id: mongoose.Types.ObjectId;
};

const surgerySeeds = [
  {
    name: 'Bright Smiles Cedar Falls',
    address: '123 Main St, Cedar Falls, IA 50613',
    phone: '(319) 555-0101',
  },
  {
    name: 'Riverbend Dental Waterloo',
    address: '456 River Rd, Waterloo, IA 50701',
    phone: '(319) 555-0102',
  },
  {
    name: 'Downtown Family Dental Waverly',
    address: '789 Bremer Ave, Waverly, IA 50677',
    phone: '(319) 555-0103',
  },
] as const;

const dentistSeeds: DentistSeed[] = [
  {
    key: 'sarah',
    firstName: 'Sarah',
    lastName: 'Miller',
    email: `sarah.miller@${DEMO_DOMAIN}`,
    phone: '(319) 555-0201',
    specialization: 'Orthodontics',
    surgeryName: 'Bright Smiles Cedar Falls',
  },
  {
    key: 'daniel',
    firstName: 'Daniel',
    lastName: 'Chen',
    email: `daniel.chen@${DEMO_DOMAIN}`,
    phone: '(319) 555-0202',
    specialization: 'Endodontics',
    surgeryName: 'Riverbend Dental Waterloo',
  },
  {
    key: 'priya',
    firstName: 'Priya',
    lastName: 'Shah',
    email: `priya.shah@${DEMO_DOMAIN}`,
    phone: '(319) 555-0203',
    specialization: 'Pediatric Dentistry',
    surgeryName: 'Downtown Family Dental Waverly',
  },
  {
    key: 'marcus',
    firstName: 'Marcus',
    lastName: 'Reed',
    email: `marcus.reed@${DEMO_DOMAIN}`,
    phone: '(319) 555-0204',
    specialization: 'Oral Surgery',
    surgeryName: 'Bright Smiles Cedar Falls',
  },
];

const patientSeeds: PatientSeed[] = [
  {
    key: 'maya',
    firstName: 'Maya',
    lastName: 'Johnson',
    email: `maya.johnson@${DEMO_DOMAIN}`,
    phone: '(319) 555-0301',
    address: '15 Oak Lane, Cedar Falls, IA 50613',
    dateOfBirth: '1994-03-15',
  },
  {
    key: 'ethan',
    firstName: 'Ethan',
    lastName: 'Brooks',
    email: `ethan.brooks@${DEMO_DOMAIN}`,
    phone: '(319) 555-0302',
    address: '88 Park Ave, Waterloo, IA 50702',
    dateOfBirth: '1988-11-02',
  },
  {
    key: 'olivia',
    firstName: 'Olivia',
    lastName: 'Patel',
    email: `olivia.patel@${DEMO_DOMAIN}`,
    phone: '(319) 555-0303',
    address: '320 Maple St, Waterloo, IA 50701',
    dateOfBirth: '2001-08-22',
  },
  {
    key: 'liam',
    firstName: 'Liam',
    lastName: 'Carter',
    email: `liam.carter@${DEMO_DOMAIN}`,
    phone: '(319) 555-0304',
    address: '41 College Hill Dr, Cedar Falls, IA 50613',
    dateOfBirth: '1979-05-11',
  },
  {
    key: 'sophia',
    firstName: 'Sophia',
    lastName: 'Nguyen',
    email: `sophia.nguyen@${DEMO_DOMAIN}`,
    phone: '(319) 555-0305',
    address: '72 Elm Ct, Waverly, IA 50677',
    dateOfBirth: '1997-09-30',
  },
  {
    key: 'noah',
    firstName: 'Noah',
    lastName: 'Davis',
    email: `noah.davis@${DEMO_DOMAIN}`,
    phone: '(319) 555-0306',
    address: '915 Sunset Blvd, Waterloo, IA 50703',
    dateOfBirth: '1990-01-18',
  },
];

function asDate(dateTime: string): Date {
  return new Date(dateTime);
}

async function cleanupExistingDemoData() {
  const demoUsers = await User.find({
    email: { $regex: new RegExp(`@${DEMO_DOMAIN.replace('.', '\\.')}$`) },
  }).select('_id');
  const demoUserIds = demoUsers.map((user) => user._id);

  const demoDentists = await Dentist.find({ userId: { $in: demoUserIds } }).select('_id');
  const demoPatients = await Patient.find({ userId: { $in: demoUserIds } }).select('_id');

  const demoDentistIds = demoDentists.map((dentist) => dentist._id);
  const demoPatientIds = demoPatients.map((patient) => patient._id);

  const demoAppointments = await Appointment.find({
    $or: [{ dentistId: { $in: demoDentistIds } }, { patientId: { $in: demoPatientIds } }],
  }).select('_id');
  const demoAppointmentIds = demoAppointments.map((appointment) => appointment._id);

  await Bill.deleteMany({
    $or: [{ patientId: { $in: demoPatientIds } }, { appointmentId: { $in: demoAppointmentIds } }],
  });
  await AppointmentRequest.deleteMany({ patientId: { $in: demoPatientIds } });
  await Appointment.deleteMany({ _id: { $in: demoAppointmentIds } });
  await Dentist.deleteMany({ _id: { $in: demoDentistIds } });
  await Patient.deleteMany({ _id: { $in: demoPatientIds } });
  await User.deleteMany({ _id: { $in: demoUserIds } });
  await Surgery.deleteMany({ name: { $in: DEMO_SURGERY_NAMES } });
}

async function createUser(email: string, role: Role, passwordHash: string) {
  return User.create({ email, role, passwordHash });
}

async function main() {
  if (!process.env.MONGO_DB_URL) {
    throw new Error('MONGO_DB_URL is required to seed demo data');
  }

  await connectToDatabase();
  await cleanupExistingDemoData();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const surgeries = new Map<string, EntityRef>();
  for (const seed of surgerySeeds) {
    const surgery = await Surgery.create(seed);
    surgeries.set(seed.name, surgery);
  }

  await createUser(`office.manager@${DEMO_DOMAIN}`, 'OFFICE_MANAGER', passwordHash);

  const dentists = new Map<string, EntityRef>();
  for (const seed of dentistSeeds) {
    const user = await createUser(seed.email, 'DENTIST', passwordHash);
    const dentist = await Dentist.create({
      userId: user._id,
      firstName: seed.firstName,
      lastName: seed.lastName,
      phone: seed.phone,
      specialization: seed.specialization,
      surgeryId: surgeries.get(seed.surgeryName)!._id,
    });
    dentists.set(seed.key, dentist);
  }

  const patients = new Map<string, EntityRef>();
  for (const seed of patientSeeds) {
    const user = await createUser(seed.email, 'PATIENT', passwordHash);
    const patient = await Patient.create({
      userId: user._id,
      firstName: seed.firstName,
      lastName: seed.lastName,
      phone: seed.phone,
      address: seed.address,
      dateOfBirth: asDate(`${seed.dateOfBirth}T00:00:00.000Z`),
    });
    patients.set(seed.key, patient);
  }

  const appointments = new Map<string, EntityRef>();
  const appointmentSeeds: Array<{
    key: string;
    dentistKey: string;
    patientKey: string;
    dateTime: string;
    status: AppointmentStatus;
    notes: string;
  }> = [
    {
      key: 'sarah-maya-completed',
      dentistKey: 'sarah',
      patientKey: 'maya',
      dateTime: '2026-04-20T14:00:00.000Z',
      status: 'COMPLETED',
      notes: 'Routine cleaning and polish.',
    },
    {
      key: 'sarah-ethan-completed',
      dentistKey: 'sarah',
      patientKey: 'ethan',
      dateTime: '2026-04-21T15:30:00.000Z',
      status: 'COMPLETED',
      notes: 'Root canal follow-up visit.',
    },
    {
      key: 'sarah-olivia-scheduled',
      dentistKey: 'sarah',
      patientKey: 'olivia',
      dateTime: '2026-04-22T16:00:00.000Z',
      status: 'SCHEDULED',
      notes: 'Brace adjustment consultation.',
    },
    {
      key: 'sarah-liam-scheduled',
      dentistKey: 'sarah',
      patientKey: 'liam',
      dateTime: '2026-04-23T18:00:00.000Z',
      status: 'SCHEDULED',
      notes: 'Alignment review and imaging.',
    },
    {
      key: 'sarah-noah-scheduled',
      dentistKey: 'sarah',
      patientKey: 'noah',
      dateTime: '2026-04-24T13:00:00.000Z',
      status: 'SCHEDULED',
      notes: 'Consultation for wisdom tooth referral.',
    },
    {
      key: 'daniel-maya-scheduled',
      dentistKey: 'daniel',
      patientKey: 'maya',
      dateTime: '2026-04-27T14:30:00.000Z',
      status: 'SCHEDULED',
      notes: 'Sensitivity assessment on lower molar.',
    },
    {
      key: 'priya-liam-scheduled',
      dentistKey: 'priya',
      patientKey: 'liam',
      dateTime: '2026-04-28T15:00:00.000Z',
      status: 'SCHEDULED',
      notes: 'Family dentistry follow-up.',
    },
    {
      key: 'marcus-olivia-scheduled',
      dentistKey: 'marcus',
      patientKey: 'olivia',
      dateTime: '2026-04-29T19:00:00.000Z',
      status: 'SCHEDULED',
      notes: 'Pre-surgery wisdom tooth consultation.',
    },
    {
      key: 'priya-liam-completed',
      dentistKey: 'priya',
      patientKey: 'liam',
      dateTime: '2026-04-14T16:30:00.000Z',
      status: 'COMPLETED',
      notes: 'Pediatric history transferred for family charting.',
    },
    {
      key: 'marcus-noah-cancelled',
      dentistKey: 'marcus',
      patientKey: 'noah',
      dateTime: '2026-04-18T17:00:00.000Z',
      status: 'CANCELLED',
      notes: 'Cancelled after patient travel conflict.',
    },
  ];

  for (const seed of appointmentSeeds) {
    const appointment = await Appointment.create({
      dentistId: dentists.get(seed.dentistKey)!._id,
      patientId: patients.get(seed.patientKey)!._id,
      dateTime: asDate(seed.dateTime),
      status: seed.status,
      notes: seed.notes,
    });
    appointments.set(seed.key, appointment);
  }

  await Bill.create({
    appointmentId: appointments.get('sarah-maya-completed')!._id,
    patientId: patients.get('maya')!._id,
    amount: 180,
    isPaid: true,
    dueDate: asDate('2026-05-04T00:00:00.000Z'),
  });

  await Bill.create({
    appointmentId: appointments.get('sarah-ethan-completed')!._id,
    patientId: patients.get('ethan')!._id,
    amount: 420,
    isPaid: false,
    dueDate: asDate('2026-05-05T00:00:00.000Z'),
  });

  await Bill.create({
    appointmentId: appointments.get('priya-liam-completed')!._id,
    patientId: patients.get('liam')!._id,
    amount: 95,
    isPaid: true,
    dueDate: asDate('2026-04-30T00:00:00.000Z'),
  });

  const requestSeeds: Array<{
    patientKey: string;
    requestType: RequestType;
    requestedDate: string;
    appointmentKey?: string;
  }> = [
    {
      patientKey: 'olivia',
      requestType: 'PHONE',
      requestedDate: '2026-04-19T13:00:00.000Z',
      appointmentKey: 'sarah-olivia-scheduled',
    },
    {
      patientKey: 'maya',
      requestType: 'ONLINE',
      requestedDate: '2026-04-25T09:00:00.000Z',
      appointmentKey: 'daniel-maya-scheduled',
    },
    {
      patientKey: 'sophia',
      requestType: 'ONLINE',
      requestedDate: '2026-05-03T15:00:00.000Z',
    },
    {
      patientKey: 'noah',
      requestType: 'PHONE',
      requestedDate: '2026-04-30T18:00:00.000Z',
    },
  ];

  for (const seed of requestSeeds) {
    await AppointmentRequest.create({
      patientId: patients.get(seed.patientKey)!._id,
      requestType: seed.requestType,
      requestedDate: asDate(seed.requestedDate),
      appointmentId: seed.appointmentKey ? appointments.get(seed.appointmentKey)!._id : undefined,
    });
  }

  const counts = await Promise.all([
    Surgery.countDocuments({ name: { $in: DEMO_SURGERY_NAMES } }),
    Dentist.countDocuments({ _id: { $in: Array.from(dentists.values()).map((dentist) => dentist._id) } }),
    Patient.countDocuments({ _id: { $in: Array.from(patients.values()).map((patient) => patient._id) } }),
    Appointment.countDocuments({
      _id: { $in: Array.from(appointments.values()).map((appointment) => appointment._id) },
    }),
    AppointmentRequest.countDocuments({
      patientId: { $in: Array.from(patients.values()).map((patient) => patient._id) },
    }),
    Bill.countDocuments({ patientId: { $in: Array.from(patients.values()).map((patient) => patient._id) } }),
  ]);

  console.log('Demo data seeded successfully.\n');
  console.log(`Surgeries: ${counts[0]}`);
  console.log(`Dentists: ${counts[1]}`);
  console.log(`Patients: ${counts[2]}`);
  console.log(`Appointments: ${counts[3]}`);
  console.log(`Appointment requests: ${counts[4]}`);
  console.log(`Bills: ${counts[5]}\n`);
  console.log('Login credentials');
  console.log(`Office Manager: office.manager@${DEMO_DOMAIN} / ${DEMO_PASSWORD}`);
  console.log(`Dentist: ${dentistSeeds[0].email} / ${DEMO_PASSWORD}`);
  console.log(`Patient with open balance: ${patientSeeds[1].email} / ${DEMO_PASSWORD}`);
  console.log(`Patient with pending request: ${patientSeeds[4].email} / ${DEMO_PASSWORD}\n`);
  console.log('Suggested demo stories');
  console.log('- Sarah Miller already has 5 non-cancelled appointments in the week of 2026-04-20.');
  console.log('- Ethan Brooks has an unpaid bill and should be blocked from creating a new request.');
  console.log('- Sophia Nguyen has a pending ONLINE request that has not been booked yet.');
}

main()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
