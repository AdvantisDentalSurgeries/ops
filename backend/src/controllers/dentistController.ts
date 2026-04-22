import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getDentists } from '../services/dentistService';

export async function list(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const dentists = await getDentists();
  res.json(dentists);
}
