import { Appointment, AppointmentRequest, Bill, DentistProfile, PatientProfile, Surgery } from '../types'

type RawDentist = {
  id?: string
  firstName?: string
  lastName?: string
  surgery?: { name?: string }
  surgeryId?: { name?: string }
}

type RawPatient = {
  id?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  bills?: { isPaid?: boolean }[]
  user?: { email?: string }
  userId?: { email?: string }
}

type RawSurgery = {
  id?: string
  name?: string
  address?: string
  phone?: string
}

type RawDentistProfile = {
  id: string
  userId?: string | { email?: string }
  firstName?: string
  lastName?: string
  phone?: string
  specialization?: string
  surgery?: RawSurgery
  surgeryId?: string | RawSurgery
}

type RawPatientProfile = {
  id: string
  userId?: string | { email?: string }
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  bills?: { isPaid?: boolean }[]
}

type RawAppointment = {
  id: string
  dateTime: string
  status: Appointment['status']
  notes?: string | null
  dentist?: RawDentist
  dentistId?: string | RawDentist
  patient?: RawPatient
  patientId?: string | RawPatient
  bill?: Appointment['bill']
}

type RawAppointmentRequest = {
  id: string
  requestType: AppointmentRequest['requestType']
  requestedDate: string
  patient?: AppointmentRequest['patient']
  patientId?: RawPatient
}

type RawBill = {
  id: string
  amount: string | number
  isPaid: boolean
  dueDate: string
  appointment?: Bill['appointment']
  appointmentId?: {
    dateTime?: string
    dentist?: { firstName?: string; lastName?: string }
    dentistId?: { firstName?: string; lastName?: string }
  }
}

function asObject<T>(value: string | T | undefined | null): T | null {
  if (!value || typeof value === 'string') return null
  return value
}

export function normalizeAppointment(raw: RawAppointment): Appointment {
  const dentist = raw.dentist ?? asObject(raw.dentistId)
  const patient = raw.patient ?? asObject(raw.patientId)
  const surgery = dentist?.surgery ?? dentist?.surgeryId

  return {
    id: raw.id,
    dateTime: raw.dateTime,
    status: raw.status,
    notes: raw.notes ?? null,
    dentist: {
      id: dentist?.id,
      firstName: dentist?.firstName ?? 'Unknown',
      lastName: dentist?.lastName ?? 'dentist',
      surgery: {
        name: surgery?.name ?? 'Unassigned surgery',
      },
    },
    patient: {
      id: patient?.id,
      firstName: patient?.firstName ?? 'Unknown',
      lastName: patient?.lastName ?? 'patient',
    },
    bill: raw.bill ?? null,
  }
}

export function normalizeAppointmentRequest(raw: RawAppointmentRequest): AppointmentRequest {
  const patient = raw.patient ?? raw.patientId
  const email =
    patient && 'user' in patient
      ? patient.user?.email ?? ''
      : patient && 'userId' in patient
        ? patient.userId?.email ?? ''
        : ''

  return {
    id: raw.id,
    requestType: raw.requestType,
    requestedDate: raw.requestedDate,
    patient: {
      firstName: patient?.firstName ?? 'Unknown',
      lastName: patient?.lastName ?? 'patient',
      user: { email },
    },
  }
}

export function normalizeBill(raw: RawBill): Bill {
  const appointment = raw.appointment ?? raw.appointmentId
  const dentist =
    appointment && 'dentist' in appointment
      ? appointment.dentist
      : appointment && 'dentistId' in appointment
        ? appointment.dentistId
        : undefined

  return {
    id: raw.id,
    amount: String(raw.amount),
    isPaid: raw.isPaid,
    dueDate: raw.dueDate,
    appointment: {
      dateTime: appointment?.dateTime ?? raw.dueDate,
      dentist: {
        firstName: dentist?.firstName ?? 'Unknown',
        lastName: dentist?.lastName ?? 'dentist',
      },
    },
  }
}

export function normalizeSurgery(raw: RawSurgery): Surgery {
  return {
    id: raw.id ?? '',
    name: raw.name ?? 'Unnamed surgery',
    address: raw.address ?? 'No address',
    phone: raw.phone ?? 'No phone',
  }
}

export function normalizeDentistProfile(raw: RawDentistProfile): DentistProfile {
  const surgery = raw.surgery ?? asObject(raw.surgeryId)
  const user = asObject(raw.userId)

  return {
    id: raw.id,
    userId: typeof raw.userId === 'string' ? raw.userId : '',
    firstName: raw.firstName ?? 'Unknown',
    lastName: raw.lastName ?? 'dentist',
    phone: raw.phone ?? 'No phone',
    specialization: raw.specialization ?? 'General dentistry',
    surgery: normalizeSurgery(surgery ?? {}),
    user: {
      email: user?.email ?? '',
    },
  }
}

export function normalizePatientProfile(raw: RawPatientProfile): PatientProfile {
  const user = asObject(raw.userId)

  return {
    id: raw.id,
    userId: typeof raw.userId === 'string' ? raw.userId : '',
    firstName: raw.firstName ?? 'Unknown',
    lastName: raw.lastName ?? 'patient',
    phone: raw.phone ?? 'No phone',
    address: raw.address ?? 'No address',
    dateOfBirth: raw.dateOfBirth ?? new Date(0).toISOString(),
    user: {
      email: user?.email ?? '',
    },
    bills: (raw.bills ?? []).map((bill) => ({ isPaid: Boolean(bill.isPaid) })),
  }
}
