import { Request } from 'express';

export type Role = 'OFFICE_MANAGER' | 'DENTIST' | 'PATIENT';
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type RequestType = 'PHONE' | 'ONLINE';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
