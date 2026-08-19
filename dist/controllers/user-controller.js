"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = __importDefault(require("../services/user-service"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const helperFunctions_1 = require("../utils/helperFunctions");
const email_service_1 = __importDefault(require("../services/email-service"));
exports.UserController = {
    createUser: async (req, res) => {
        try {
            const { fullName, email, password, businessName, industry, size, role } = req.body;
            const userData = {
                fullName,
                email,
                password,
                businessName,
                industry,
                size,
                role,
            };
            const existingUser = await user_service_1.default.getUserByEmail(email);
            if (existingUser) {
                return res
                    .status(400)
                    .json({ success: false, message: "Email already exists." });
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            userData.password = hashedPassword;
            const user = await user_service_1.default.createUser(userData);
            const token = (0, helperFunctions_1.generateAccessToken)(user._id.toString(), user.email, user.role || "user");
            user.token = token;
            const updatedUser = await user.save();
            await email_service_1.default.sendWelcomeEmail(user.email, user.fullName);
            res.status(201).json({ success: true, data: updatedUser });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await user_service_1.default.getUserByEmail(email);
            if (!user) {
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid email or password." });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid email or password." });
            }
            const token = (0, helperFunctions_1.generateAccessToken)(user._id.toString(), user.email, user.role || "user");
            user.token = token;
            const updatedUser = await user.save();
            res.status(200).json({ success: true, data: updatedUser });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await user_service_1.default.getUserByEmail(email);
            if (!user) {
                return res
                    .status(400)
                    .json({ success: false, message: "Email not found." });
            }
            const otp = (0, helperFunctions_1.generateOTP)();
            await user_service_1.default.updateUserOtpOrToken(email, otp);
            // TODO: Uncomment the line below to send the OTP email when email service is set up
            // await emailService.sendOTPEmail(user.email, user.fullName, otp);
            res.status(200).json({
                success: true,
                message: "Password reset instructions sent to your email.",
                otp: otp, // Include the generated OTP in the response (for demonstration purposes only)
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    verifyPasswordOtp: async (req, res) => {
        try {
            const { otp, email } = req.body;
            const isOtpVerified = await user_service_1.default.verifyOtp(email, otp);
            if (isOtpVerified) {
                const token = (0, helperFunctions_1.generateAccessToken)("2rtgdf546g", email, "temp");
                await user_service_1.default.updateUserOtpOrToken(email, "", token);
                return res.status(200).json({
                    success: true,
                    message: "Otp verified successfully.",
                    token,
                });
            }
            res
                .status(400)
                .json({ success: false, message: "Invalid or expired otp" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: "Failed to verify otp" });
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { email, otp, newPassword } = req.body;
            const isOtpValid = await user_service_1.default.verifyOtp(email, otp);
            if (!isOtpValid) {
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid OTP." });
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            const updatedUser = await user_service_1.default.updateUserOtpOrToken(email, "", "");
            if (updatedUser) {
                updatedUser.password = hashedPassword;
                await updatedUser.save();
            }
            res
                .status(200)
                .json({ success: true, message: "Password reset successful." });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
};
