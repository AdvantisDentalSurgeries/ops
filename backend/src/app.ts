import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import authRoutes from "./routes/auth";
import appointmentRoutes from "./routes/appointments";
import dentistRoutes from "./routes/dentists";
import patientRoutes from "./routes/patients";
import requestRoutes from "./routes/requests";
import billRoutes from "./routes/bills";
import surgeryRoutes from "./routes/surgeries";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/surgeries", surgeryRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

export default app;
