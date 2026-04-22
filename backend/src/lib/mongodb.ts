import mongoose from "mongoose";

export async function connectToDatabase(): Promise<void> {
  await mongoose.connect(process.env.MONGO_DB_URL!);
}
