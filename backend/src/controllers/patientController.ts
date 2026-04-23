import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getPatients } from "../services/patientService";

export async function list(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const patients = await getPatients();
  res.json(patients);
}
