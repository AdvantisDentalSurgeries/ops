import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { registerDentist } from "../services/dentistService";
import { enrollPatient } from "../services/patientService";
import { AuthenticatedRequest } from "../types";

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    console.log("user", user);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ access_token, role: user.role, userId: user.id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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

  let userId: string | undefined;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, role });
    userId = user.id;

    let result;
    if (role === "DENTIST") {
      if (!profile.specialization || !profile.surgeryId) {
        res.status(400).json({
          error: "specialization and surgeryId are required for dentists",
        });
        await User.findByIdAndDelete(userId);
        return;
      }
      result = await registerDentist({
        userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        specialization: profile.specialization,
        surgeryId: profile.surgeryId,
      });
    } else {
      if (!profile.address || !profile.dateOfBirth) {
        res.status(400).json({
          error: "address and dateOfBirth are required for patients",
        });
        await User.findByIdAndDelete(userId);
        return;
      }
      result = await enrollPatient({
        userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: new Date(profile.dateOfBirth),
      });
    }

    res.status(201).json(result);
  } catch (err) {
    if (userId) {
      await User.findByIdAndDelete(userId).catch(() => {});
    }
    console.error("Registration failed, rolled back user:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}
