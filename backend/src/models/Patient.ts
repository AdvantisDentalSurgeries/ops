import { Schema, model, Types } from 'mongoose';

export interface IPatient {
  id: string;
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  bills?: Types.ObjectId[];
}

const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
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

patientSchema.virtual('bills', {
  ref: 'Bill',
  localField: '_id',
  foreignField: 'patientId',
});

export const Patient = model<IPatient>('Patient', patientSchema);
