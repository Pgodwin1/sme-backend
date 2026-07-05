import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error);
    process.exit(1);
  }
}
