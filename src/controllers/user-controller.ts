import { Request, Response } from "express";
import userService from "../services/user-service";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateOTP,
  generateResetToken,
  verifyResetToken,
} from "../utils/helperFunctions";
import emailService from "../services/email-service";
import { IUserDoc } from "../interface/user-interface";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const sanitizeUser = (user: IUserDoc) => {
  const { password, otp, otpExpiresAt, ...safeUser } = user.toObject();
  return safeUser;
};

export const UserController = {
  createUser: async (req: Request, res: Response) => {
    try {
      const { fullName, email, password, businessName, industry, size, role } =
        req.body;

      const userData = {
        fullName,
        email,
        password,
        businessName,
        industry,
        size,
        role,
      };

      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      userData.password = hashedPassword;

      const user = await userService.createUser(userData);
      const token = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role || "user",
      );

      user.token = token;
      const updatedUser = await user.save();

      await emailService.sendWelcomeEmail(user.email, user.fullName);

      res.status(201).json({ success: true, data: sanitizeUser(updatedUser) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email or password." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email or password." });
      }

      const token = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role || "user",
      );

      user.token = token;
      const updatedUser = await user.save();

      res.status(200).json({ success: true, data: sanitizeUser(updatedUser) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required." });
      }

      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Email not found." });
      }

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
      await userService.setOtp(email, otp, otpExpiresAt);
      await emailService.sendOTPEmail(user.email, user.fullName, otp);

      res.status(200).json({
        success: true,
        message: "Password reset instructions sent to your email.",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  verifyPasswordOtp: async (req: Request, res: Response) => {
    try {
      const { otp, email } = req.body;
      if (!otp || !email) {
        return res
          .status(400)
          .json({ success: false, message: "Email and otp are required." });
      }

      const isOtpVerified = await userService.verifyOtp(email, otp);
      if (!isOtpVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired otp." });
      }

      await userService.clearOtp(email);
      const resetToken = generateResetToken(email);

      res.status(200).json({
        success: true,
        message: "Otp verified successfully.",
        resetToken,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to verify otp" });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Reset token and new password are required.",
        });
      }

      const decoded = verifyResetToken(resetToken);
      if (!decoded) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired reset token." });
      }

      const user = await userService.getUserByEmail(decoded.email);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found." });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.token = "";
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Password reset successful." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMe: async (req: Request, res: Response) => {
    try {
      const user = await userService.getUserById(req.user!.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.status(200).json({ success: true, data: sanitizeUser(user) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  completeOnboarding: async (req: Request, res: Response) => {
    try {
      const { businessName, industry, size, role } = req.body;

      if (!businessName && !industry && !size && !role) {
        return res.status(400).json({
          success: false,
          message: "At least one onboarding field is required.",
        });
      }

      const updatedUser = await userService.completeOnboarding(req.user!.id, {
        businessName,
        industry,
        size,
        role,
      });

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.status(200).json({ success: true, data: sanitizeUser(updatedUser) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
