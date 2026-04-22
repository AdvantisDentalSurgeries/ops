import { Schema, model, Types } from 'mongoose';

export interface IDentist {
  id: string;
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  surgeryId: Types.ObjectId;
}

const dentistSchema = new Schema<IDentist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    specialization: { type: String, required: true },
    surgeryId: { type: Schema.Types.ObjectId, ref: 'Surgery', required: true },
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

export const Dentist = model<IDentist>('Dentist', dentistSchema);
