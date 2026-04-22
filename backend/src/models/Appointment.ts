import { Schema, model, Types } from 'mongoose';
import type { AppointmentStatus } from '../types';

export interface IAppointment {
  id: string;
  dentistId: Types.ObjectId;
  patientId: Types.ObjectId;
  dateTime: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    dentistId: { type: Schema.Types.ObjectId, ref: 'Dentist', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    dateTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
      default: 'SCHEDULED',
    },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
