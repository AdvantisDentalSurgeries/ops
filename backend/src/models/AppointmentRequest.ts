import { Schema, model, Types } from 'mongoose';
import type { RequestType } from '../types';

export interface IAppointmentRequest {
  id: string;
  patientId: Types.ObjectId;
  requestType: RequestType;
  requestedDate: Date;
  appointmentId?: Types.ObjectId;
  createdAt: Date;
}

const appointmentRequestSchema = new Schema<IAppointmentRequest>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    requestType: { type: String, enum: ['PHONE', 'ONLINE'], required: true },
    requestedDate: { type: Date, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
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

export const AppointmentRequest = model<IAppointmentRequest>(
  'AppointmentRequest',
  appointmentRequestSchema
);
