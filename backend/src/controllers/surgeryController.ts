import { Response } from 'express';
import { Surgery } from '../models/Surgery';
import { AuthenticatedRequest } from '../types';

export async function list(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const surgeries = await Surgery.find().sort({ name: 1 });
  res.json(surgeries);
}

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, address, phone } = req.body as {
    name: string;
    address: string;
    phone: string;
  };

  if (!name || !address || !phone) {
    res.status(400).json({ error: 'name, address, and phone are required' });
    return;
  }

  const surgery = await Surgery.create({ name, address, phone });
  res.status(201).json(surgery);
}
