import mongoose, { Document } from "mongoose";

export enum UserRole {
  Admin = "admin",
  User = "user",
}

export interface IUser {
  fullName: string;
  email: string;
  businessName?: string;
  industry?: string;
  size?: string;
  role?: UserRole;
  password: string;
  token?: string;
  otp?: string;
}

export interface IUserDoc extends IUser, Document {}