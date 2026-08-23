import { Schema, model } from "mongoose";
import { IUserDoc, UserRole } from "../interface/user-interface";

const userSchema = new Schema<IUserDoc>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    businessName: {
      type: String,
      required: false,
      trim: true,
    },
    industry: {
      type: String,
      required: false,
      trim: true,
    },
    size: {
      type: String,
      required: false,
      trim: true,
    },
    role: {
      type: String,
      required: false,
      enum: Object.values(UserRole),
    },
    token: {
      type: String,
      required: false,
      default: "",
    },
    otp: {
      type: String,
      required: false,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      required: false,
      default: null,
    },
    isOnboarded: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model("User", userSchema);
