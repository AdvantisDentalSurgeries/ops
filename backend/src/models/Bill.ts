import { Schema, model, Types } from 'mongoose';

export interface IBill {
  id: string;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  amount: number;
  isPaid: boolean;
  dueDate: Date;
  createdAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    dueDate: { type: Date, required: true },
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

export const Bill = model<IBill>('Bill', billSchema);
