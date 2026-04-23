import { NavigationItem, Role } from '../types'

export const navigationByRole: Record<Role, NavigationItem[]> = {
  OFFICE_MANAGER: [
    {
      to: '/om',
      label: 'Overview',
      description: 'Operational dashboard with quick links and live counts.',
    },
    {
      to: '/om/appointments',
      label: 'Appointments',
      description: 'Coordinate schedules, bookings, and cancellations.',
    },
    {
      to: '/om/requests',
      label: 'Requests',
      description: 'Review incoming appointment requests from patients.',
    },
    {
      to: '/om/dentists',
      label: 'Dentists',
      description: 'Register clinicians and keep surgery assignments current.',
    },
    {
      to: '/om/patients',
      label: 'Patients',
      description: 'Manage patient enrollment and billing readiness.',
    },
    {
      to: '/om/surgeries',
      label: 'Surgeries',
      description: 'Maintain practice locations and contact details.',
    },
    {
      to: '/om/bills',
      label: 'Billing',
      description: 'Track balances and settle outstanding bills.',
    },
  ],
  DENTIST: [
    {
      to: '/dentist',
      label: 'Schedule',
      description: 'See upcoming appointments and adjust changes quickly.',
    },
  ],
  PATIENT: [
    {
      to: '/patient',
      label: 'Appointments',
      description: 'View upcoming visits and manage changes.',
    },
    {
      to: '/patient/bills',
      label: 'Bills',
      description: 'Check balances and due dates without office calls.',
    },
    {
      to: '/patient/request',
      label: 'Request Visit',
      description: 'Send a preferred appointment request to the office.',
    },
  ],
}

export function roleHome(role: Role): string {
  if (role === 'OFFICE_MANAGER') return '/om'
  if (role === 'DENTIST') return '/dentist'
  return '/patient'
}

export function roleTitle(role: Role): string {
  if (role === 'OFFICE_MANAGER') return 'Office Manager Portal'
  if (role === 'DENTIST') return 'Dentist Portal'
  return 'Patient Portal'
}

export function roleAccent(role: Role): string {
  if (role === 'OFFICE_MANAGER') return 'Operations'
  if (role === 'DENTIST') return 'Chairside'
  return 'Care Journey'
}
