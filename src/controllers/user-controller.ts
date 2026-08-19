import { Request, Response } from "express";
import userService from "../services/user-service";
import bcrypt from "bcrypt";
import { generateAccessToken, generateOTP } from "../utils/helperFunctions";
import emailService from "../services/email-service";

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

      res.status(201).json({ success: true, data: updatedUser });
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

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Email not found." });
      }

      const otp = generateOTP();
      await userService.updateUserOtpOrToken(email, otp);
      // TODO: Uncomment the line below to send the OTP email when email service is set up
      // await emailService.sendOTPEmail(user.email, user.fullName, otp);

      res.status(200).json({
        success: true,
        message: "Password reset instructions sent to your email.",
        otp: otp, // Include the generated OTP in the response (for demonstration purposes only)
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  verifyPasswordOtp: async (req: Request, res: Response) => {
    try {
      const { otp, email } = req.body;
      const isOtpVerified = await userService.verifyOtp(email, otp);

      if (isOtpVerified) {
        const token = generateAccessToken("2rtgdf546g", email, "temp");

        await userService.updateUserOtpOrToken(email, "", token);

        return res.status(200).json({
          success: true,
          message: "Otp verified successfully.",
          token,
        });
      }

      res
        .status(400)
        .json({ success: false, message: "Invalid or expired otp" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to verify otp" });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;

      const isOtpValid = await userService.verifyOtp(email, otp);
      if (!isOtpValid) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid OTP." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await userService.updateUserOtpOrToken(email, "", "");
      if (updatedUser) {
        updatedUser.password = hashedPassword;
        await updatedUser.save();
      }

      res
        .status(200)
        .json({ success: true, message: "Password reset successful." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
