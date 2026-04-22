import { Dentist } from '../models/Dentist';

export async function getDentists() {
  return Dentist.find()
    .populate('userId')
    .populate('surgeryId')
    .sort({ lastName: 1, firstName: 1 });
}

export async function registerDentist(data: {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string;
  surgeryId: string;
}) {
  const dentist = await Dentist.create(data);
  return dentist.populate(['userId', 'surgeryId']);
}
