import { Schema, model } from 'mongoose';

export interface ISurgery {
  id: string;
  name: string;
  address: string;
  phone: string;
}

const surgerySchema = new Schema<ISurgery>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
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

export const Surgery = model<ISurgery>('Surgery', surgerySchema);
