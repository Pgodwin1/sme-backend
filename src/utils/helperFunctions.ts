import jwt from "jsonwebtoken";
import { env } from "../config/env";
import crypto from "crypto";

export const generateAccessToken = (
  id: string,
  email: string,
  role: string,
): string => {
  return jwt.sign({ id, email, role }, env.jwtSecret, { expiresIn: "1d" });
};

export const generateOTP = (): string => {
  // Generates a number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

export const generateResetToken = (email: string): string => {
  return jwt.sign({ email, purpose: "password_reset" }, env.jwtSecret, {
    expiresIn: "15m",
  });
};

export const verifyResetToken = (token: string): { email: string } | null => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      email: string;
      purpose: string;
    };
    if (decoded.purpose !== "password_reset") return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
};
