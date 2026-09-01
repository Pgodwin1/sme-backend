import mongoose from "mongoose";
import { env } from "./env";

// Cached across invocations so warm serverless instances (and concurrent
// requests during a cold start) reuse one connection attempt instead of
// racing to open a new one — mongoose.connect() is not safe to call
// repeatedly from a per-request handler.
let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}
