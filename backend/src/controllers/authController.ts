import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";
import { registerDentist } from "../services/dentistService";
import { enrollPatient } from "../services/patientService";
import { AuthenticatedRequest } from "../types";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    res.status(401).json({ error: error?.message ?? "Invalid credentials" });
    return;
  }
  console.log("Data", data);

  const user = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!user) {
    res.status(401).json({ error: "User account not fully set up" });
    return;
  }

  res.json({
    access_token: data.session.access_token,
    role: user.role,
    userId: user.id,
  });
}

export async function register(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { role, email, password, ...profile } = req.body as {
    role: "DENTIST" | "PATIENT";
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    // DENTIST
    specialization?: string;
    surgeryId?: string;
    // PATIENT
    address?: string;
    dateOfBirth?: string;
  };

  if (!role || !email || !password) {
    res.status(400).json({ error: "role, email, and password are required" });
    return;
  }

  if (role !== "DENTIST" && role !== "PATIENT") {
    res.status(400).json({ error: "role must be DENTIST or PATIENT" });
    return;
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    res
      .status(400)
      .json({ error: authError?.message ?? "Failed to create auth user" });
    return;
  }

  const supabaseUid = authData.user.id;

  try {
    await prisma.user.create({
      data: { id: supabaseUid, email, role: role as Role },
    });

    let result;
    if (role === "DENTIST") {
      if (!profile.specialization || !profile.surgeryId) {
        res
          .status(400)
          .json({
            error: "specialization and surgeryId are required for dentists",
          });
        return;
      }
      result = await registerDentist({
        userId: supabaseUid,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        specialization: profile.specialization,
        surgeryId: profile.surgeryId,
      });
    } else {
      if (!profile.address || !profile.dateOfBirth) {
        res
          .status(400)
          .json({ error: "address and dateOfBirth are required for patients" });
        return;
      }
      result = await enrollPatient({
        userId: supabaseUid,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: new Date(profile.dateOfBirth),
      });
    }

    res.status(201).json(result);
  } catch (err) {
    // Roll back Supabase auth user if DB write fails
    await supabaseAdmin.auth.admin.deleteUser(supabaseUid);
    console.error("Registration failed, rolled back auth user:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}
