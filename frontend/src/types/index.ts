export type Role = 'OFFICE_MANAGER' | 'DENTIST' | 'PATIENT'
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
export type RequestType = 'PHONE' | 'ONLINE'

export interface LoginResponse {
  access_token: string
  role: Role
  userId: string
}

export interface AuthUser {
  token: string
  role: Role
  userId: string
  profileId: string | null
}

export interface Surgery {
  id: string
  name: string
  address: string
  phone: string
}

export interface DentistProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  specialization: string
  surgery: Surgery
  user: { email: string }
}

export interface PatientProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  address: string
  dateOfBirth: string
  user: { email: string }
  bills: { isPaid: boolean }[]
}

export interface Appointment {
  id: string
  dateTime: string
  status: AppointmentStatus
  notes: string | null
  dentist: {
    id?: string
    firstName: string
    lastName: string
    surgery: { name: string }
  }
  patient: {
    id?: string
    firstName: string
    lastName: string
  }
  bill?: { id: string; isPaid: boolean } | null
}

export interface AppointmentRequest {
  id: string
  requestType: RequestType
  requestedDate: string
  patient: {
    firstName: string
    lastName: string
    user: { email: string }
  }
}

export interface Bill {
  id: string
  amount: string
  isPaid: boolean
  dueDate: string
  appointment: {
    dateTime: string
    dentist: { firstName: string; lastName: string }
  }
}

export interface RegisterDentistInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  specialization: string
  surgeryId: string
}

export interface EnrollPatientInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  address: string
  dateOfBirth: string
}

export interface BookAppointmentInput {
  dentistId: string
  patientId: string
  dateTime: string
  notes: string
}

export interface CreateSurgeryInput {
  name: string
  address: string
  phone: string
}

export interface SubmitRequestInput {
  requestType: RequestType
  requestedDate: string
}
